import LabelView from "../../common/LabelView.js";
import EmptyView from "../../elements/EmptyView.js";
import { assert } from "../../../core/assert.js";
import { prettyPrint } from "../../../core/NumberFormat.js";
import { TooltipParser } from "./TooltipParser.js";
import { TooltipTokenType } from "./parser/TooltipTokenType.js";
import { VisualReferenceCompilers } from "./compiler/visual/VisualReferenceCompilers.js";


/**
 * @param {object} values
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 */
function compileTextReferenceStat(values, database, localization, gml) {
    const id = values.id;
    const _case = values.case !== undefined ? values.case : "nominative";

    let key = `system_combat_unit_stat.${id}.name.case.${_case}`;

    if (!localization.hasString(key)) {
        //drop the case

        console.warn(`Key not found ${key}, dropping the case`);

        key = `system_combat_unit_stat.${id}.name`;
    }

    return localization.getString(key);
}

/**
 *
 * @param {StatModifier} stat
 * @param {Localization} localization
 * @return {string}
 */
export function statModifierToText(stat, localization) {
    const AND = ` ${localization.getString('system_list_delimiter_and')} `;

    const statName = compileTextReferenceStat({ id: stat.stat }, null, localization, null);

    const percentage = (stat.modifier.a - 1) * 100;
    const fixed = stat.modifier.b;

    const values = [];

    if (percentage > 0) {
        values.push(`+${prettyPrint(percentage)}%`);
    } else if (percentage < 0) {
        values.push(`${prettyPrint(percentage)}%`);
    }

    if (fixed > 0) {
        values.push(`+${prettyPrint(fixed)}`);
    } else if (fixed < 0) {
        values.push(`${prettyPrint(fixed)}`);
    }

    const valueText = values.join(AND);


    return `${statName} ${valueText}`;
}

const textReferenceCompilers = {
    stat: compileTextReferenceStat,
    /**
     *
     * @param {string} id
     * @param {number} charges
     * @param {boolean} showStats
     * @param {boolean} showAuras
     * @param {boolean} showTriggers
     * @param showConsumeTriggers
     * @param {StaticKnowledgeDatabase} database
     * @param {Localization} localization
     * @param {GMLEngine} gml
     */
    affliction(
        {
            id,
            charges = 1,
            showStats = true,
            showAuras = true,
            showTriggers = true,
            showConsumeTriggers = true
        }, database, localization, gml) {


        assert.notEqual(id, undefined, 'id was undefined');

        const afflictionDescription = database.afflictions.get(id);

        if (afflictionDescription === null) {
            console.error(`Affliction '${id}' was not found`);
        }

        if (gml.getReferenceDepth("AFFLICTION") > 1) {
            //we are more than X levels deep into afflictions
            showTriggers = false;
            showAuras = false;
            showStats = false;
            showConsumeTriggers = false;
        }

        const name = localization.getString(afflictionDescription.getLocalizationIdForName());

        let stats = "";
        if (showStats) {

            const statsValues = [];
            afflictionDescription.bonus.stats.forEach(stat => {
                statsValues.push(statModifierToText(stat, localization));
            });

            stats = statsValues.join('; ');
        }

        return `${name} ( ${stats} )`;
    }
};

class GMLContextFrame {
    constructor() {
        this.enableTooltips = true;
    }
}

const RECURSION_LIMIT = 50;

/**
 * Game Markup Language
 */
export class GMLEngine {

    constructor() {

        /**
         *
         * @type {StaticKnowledgeDatabase}
         */
        this.database = null;
        /**
         *
         * @type {Localization}
         */
        this.localization = null;

        /**
         *
         * @type {DomTooltipManager}
         */
        this.tooltips = null;

        /**
         * Used to prevent infinite recursion
         * @type {number}
         * @private
         */
        this.__recursionCount = 0;

        /**
         *
         * @type {Array}
         * @private
         */
        this.__recursionReferencePath = [];

        /**
         *
         * @type {GMLContextFrame[]}
         */
        this.__contextStack = [];

        /**
         *
         * @type {boolean}
         * @private
         */
        this.__tooltipsEnabled = true;


        /**
         *
         * @type {TooltipParser}
         * @private
         */
        this.__parser = new TooltipParser();
    }

    /**
     *
     * @returns {boolean}
     */
    getTooltipsEnabled() {
        return this.__tooltipsEnabled;
    }

    /**
     *
     * @param {boolean} v
     */
    setTooltipsEnabled(v) {
        this.__tooltipsEnabled = v;
    }

    /**
     * @param {StaticKnowledgeDatabase} database
     * @param {Localization} localization
     */
    initialize(database, localization) {

        /**
         *
         * @type {StaticKnowledgeDatabase}
         */
        this.database = database;
        this.localization = localization;
    }

    /**
     *
     * @returns {Promise<any>}
     */
    startup() {
        const self = this;

        return new Promise(function (resolve, reject) {
            if (self.database === null) {
                throw new Error('Database not set; probably not initialized');
            }

            self.database.promise().then(resolve, reject);
        });
    }

    /**
     *
     * @param {String} type
     * @returns {number}
     */
    getReferenceDepth(type) {
        let result = 0;

        const path = this.__recursionReferencePath;

        const pathLength = path.length;

        for (let i = 0; i < pathLength; i++) {
            const r = path[i];
            if (r.type === type) {
                result++;
            }
        }

        return result;
    }

    /**
     * @private
     * @param {Token[]} tokens
     * @returns {string}
     */
    compileTokensToText(tokens) {
        const database = this.database;
        const localization = this.localization;
        const tooltips = this.tooltips;

        const gml = this;

        /**
         *
         * @param {Token} token
         */
        function compileTextToken(token) {
            return token.value;
        }

        function compileReferenceToken(token) {
            /**
             * @type {TooltipReferenceValue}
             */
            const reference = token.value;

            const refType = reference.type.toLocaleLowerCase();

            const referenceCompiler = textReferenceCompilers[refType];

            if (referenceCompiler === undefined) {
                //unknown reference type
                console.error(`unknown reference type '${refType}'`);
                return;
            }

            let result;

            gml.__recursionReferencePath.push(reference);

            try {
                result = referenceCompiler(reference.values, database, localization, gml, tooltips);
            } catch (e) {
                console.error(`Failed to compile reference token`, token, 'ERROR:', e, 'token stream:', tokens);
                result = 'ERROR';
            }

            gml.__recursionReferencePath.pop();

            return result;
        }

        const result = tokens.map(t => {
            let v;
            const tokenType = t.type;

            if (tokenType === TooltipTokenType.Reference) {
                v = compileReferenceToken(t);
            } else if (tokenType === TooltipTokenType.Text) {
                v = compileTextToken(t);
            } else if (tokenType === TooltipTokenType.StyleStart) {
                //do nothing
            } else if (tokenType === TooltipTokenType.StyleEnd) {
                //do nothing
            } else {
                throw new TypeError(`Unsupported token type '${tokenType}'`);
            }

            return v;
        })
            .filter(v => v !== undefined)
            .join('');

        return result;
    }

    /**
     *
     * @param {Token[]} tokens
     * @param {View} [target]
     * @returns {View}
     * @private
     */
    compileTokensToVisual(tokens, target = new EmptyView({ tag: 'span' })) {
        const database = this.database;
        const localization = this.localization;
        const tooltips = this.tooltips;

        const gml = this;

        /**
         *
         * @param {Token} token
         * @param {View[]} result
         */
        function compileTextToken(token, result) {

            /**
             * @type {string}
             */
            const tokenValue = token.value;

            const view = new LabelView(tokenValue, { tag: 'span' });

            result.push(view);

        }

        /**
         *
         * @param {Token} token
         * @param {View[]} result
         */
        function compileReferenceToken(token, result) {
            /**
             * @type {TooltipReferenceValue}
             */
            const reference = token.value;

            const refType = reference.type.toLocaleLowerCase();

            const referenceCompiler = VisualReferenceCompilers[refType];

            if (referenceCompiler === undefined) {
                //unknown reference type
                console.error(`unknown reference type '${refType}'`);
                return;
            }

            let view;

            gml.__recursionReferencePath.push(reference);

            try {
                view = referenceCompiler(reference.values, database, localization, gml, tooltips);
            } catch (e) {
                console.error(`Failed to compile reference token`, token, 'ERROR:', e, 'token stream:', tokens);
                view = new LabelView('ERROR');
            }

            gml.__recursionReferencePath.pop();

            view.addClass('reference-type-' + refType);

            result.push(view);
        }


        //style stack
        const styleSet = [];


        let containerElement = target;

        function makeStyleContainer() {
            const view = new EmptyView({ tag: 'span' });

            styleSet.forEach(n => view.addClass(n));

            return view;
        }

        function pushStyle(name) {
            styleSet.push(name);

            const el = makeStyleContainer();

            target.addChild(el);

            containerElement = el;
        }

        function popStyle(name) {
            const i = styleSet.indexOf(name);

            if (i === -1) {
                console.error(`encountered closing token for a style(name=${name}) that is not open. Current style set: [${styleSet}]`);
                //bail
                return;
            }

            styleSet.splice(i, 1);

            if (styleSet.length === 0) {
                containerElement = target;
            } else {
                //close current container and start a new one
                const el = makeStyleContainer();

                target.addChild(el);

                containerElement = el;
            }
        }

        const tokenCount = tokens.length;

        for (let i = 0; i < tokenCount; i++) {
            let t = tokens[i];

            /**
             * @type {View[]}
             */
            const childViews = [];

            const tokenType = t.type;

            if (tokenType === TooltipTokenType.Reference) {
                compileReferenceToken(t, childViews);
            } else if (tokenType === TooltipTokenType.Text) {
                compileTextToken(t, childViews);
            } else if (tokenType === TooltipTokenType.StyleStart) {
                pushStyle(t.value);
            } else if (tokenType === TooltipTokenType.StyleEnd) {
                popStyle(t.value);
            } else {
                throw new TypeError(`Unsupported token type '${tokenType}'`);
            }

            const nChildren = childViews.length;

            for (let j = 0; j < nChildren; j++) {
                const childView = childViews[j];

                containerElement.addChild(childView);
            }

        }

        return target;
    }

    pushState() {
        const frame = new GMLContextFrame();

        frame.enableTooltips = this.__tooltipsEnabled;

        this.__contextStack.push(frame);
    }

    popState() {
        const frame = this.__contextStack.pop();

        this.__tooltipsEnabled = frame.enableTooltips;
    }

    /**
     *
     * @param {string} code
     * @return {string}
     */
    compileAsText(code) {
        if (this.__recursionCount >= RECURSION_LIMIT) {
            console.error(`Hit recursion limit(=${RECURSION_LIMIT}), returning empty view`);
            return "";
        }

        this.__recursionCount++;

        this.pushState();

        try {
            const tokens = this.__parser.parse(code);

            const result = this.compileTokensToText(tokens);

            return result;
        } finally {

            //restore frame
            this.popState();

            this.__recursionCount--;
        }
    }

    /**
     *
     * @param {string} code
     * @param {View} [target]
     * @returns {View}
     */
    compile(code, target) {
        if (this.__recursionCount >= RECURSION_LIMIT) {
            console.error(`Hit recursion limit(=${RECURSION_LIMIT}), returning empty view`);
            return new EmptyView();
        } else {

            this.__recursionCount++;

            this.pushState();

            try {
                const tokens = this.__parser.parse(code);

                const view = this.compileTokensToVisual(tokens, target);

                return view;
            } finally {

                //restore frame
                this.popState();

                this.__recursionCount--;

            }

        }
    }

}
