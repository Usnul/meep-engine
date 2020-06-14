import View from "../View.js";
import LabelView from "../common/LabelView.js";
import EmptyView from "../elements/EmptyView.js";
import { assert } from "../../core/assert.js";
import UnitAffliction from "../../../model/game/logic/combat/unit/afflictions/UnitAffliction.js";
import AfflictionView from "../../../view/units/affliction/AfflictionView.js";
import { AfflictionDescriptionView } from "../../../view/units/affliction/AfflictionDescriptionView.js";
import ItemView from "../../../view/game/items/ItemView.js";
import Item from "../../../model/game/ecs/component/Item.js";
import { LocalizedLabelView } from "../common/LocalizedLabelView.js";
import { AfflictionTooltipView } from "../../../view/units/affliction/AfflictionTooltipView.js";
import { TalentLevelDescriptionView } from "../../../view/units/talent/TalentLevelDescriptionView.js";
import { prettyPrint } from "../../core/NumberFormat.js";
import { TooltipParser } from "./TooltipParser.js";
import { TooltipTokenType } from "./parser/TooltipTokenType.js";

/**
 *
 * @param {object} values
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
function compileReferenceAction(values, database, localization, gml, tooltips) {
    const actionDescription = database.actions.get(id);

    const name = actionDescription.name;

    return new LabelView(name);
}

/**
 *
 * @param {string} id
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
function compileReferenceCreature({ id }, database, localization, gml, tooltips) {
    /**
     *
     * @type {CombatUnitDescription}
     */
    const unitDescription = database.units.get(id);

    const unitName = unitDescription.getLocalizationKeyForName();

    return new LocalizedLabelView({ id: unitName, localization });
}

/**
 *
 * @param {number} value
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
function compileReferenceMoney({ value }, database, localization, gml, tooltips) {

    return new LabelView(value, {
        tag: 'span'
    });
}

/**
 * @param {object} values
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
function compileReferenceStat(values, database, localization, gml, tooltips) {
    const id = values.id;
    const _case = values.case !== undefined ? values.case : "nominative";

    let key = `system_combat_unit_stat.${id}.name.case.${_case}`;

    if (!localization.hasString(key)) {
        //drop the case

        console.warn(`Key not found ${key}, dropping the case`);

        key = `system_combat_unit_stat.${id}.name`;
    }

    const view = new LocalizedLabelView({
        id: key,
        localization,
        tag: 'span'
    });

    if (gml.getTooltipsEnabled() && tooltips !== null) {
        const code = localization.getString(`system_combat_unit_stat.${id}.tip`, {
            reduction: ''
        });

        tooltips.manage(view, () => gml.compile(code));
    }

    return view;
}

/**
 *
 * @param {object} values
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
function compileReferenceTalent({ id }, database, localization, gml, tooltips) {
    /**
     *
     * @type {TalentDescription}
     */
    const talentDescription = database.talents.get(id);

    const key = talentDescription.getLocalizationKeyForName();

    const view = new LocalizedLabelView({ id: key, localization, gml, tag: 'span' });

    if (gml.getTooltipsEnabled() && tooltips !== null) {
        tooltips.manage(view, () => {
            const v = new TalentLevelDescriptionView(talentDescription.levels[0], { localization, gml });

            return v;
        });
    }

    return view;
}

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
 * @param {DomTooltipManager} tooltips
 */
function compileReferenceAffliction(
    {
        id,
        charges = 1,
        showStats = true,
        showAuras = true,
        showTriggers = true,
        showConsumeTriggers = true
    }, database, localization, gml, tooltips) {
    assert.notEqual(id, undefined, 'id was undefined');

    const afflictionDescription = database.afflictions.get(id);

    if (afflictionDescription === null) {
        console.error(`Affliction '${id}' was not found`);
    }

    const affliction = new UnitAffliction();
    affliction.description = afflictionDescription;
    affliction.charges.set(charges);

    const view = new AfflictionView(affliction);

    const result = new EmptyView({ tag: 'span' });

    if (gml.getTooltipsEnabled() && tooltips !== null) {
        tooltips.manage(result, () => new AfflictionTooltipView({ affliction, localization, gml }));
    }

    result.addChild(view);

    const sAfflictionName = localization.getString(`affliction.${id}.name`);

    result.addChild(new LabelView(sAfflictionName, { classList: ['affliction-name'] }));

    if (gml.getReferenceDepth("AFFLICTION") > 1) {
        //we are more than X levels deep into afflictions
        showTriggers = false;
        showAuras = false;
        showStats = false;
        showConsumeTriggers = false;
    }

    result.addChild(new AfflictionDescriptionView(afflictionDescription, {
        localization,
        gml,
        showStats,
        showAuras,
        showTriggers,
        showConsumeTriggers
    }));

    return result;
}

/**
 *
 * @param {string} id
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
function compileReferenceItem({ id }, database, localization, gml, tooltips) {

    /**
     *
     * @type {ItemDescription}
     */
    const itemDescription = database.items.get(id);

    const item = new Item();
    item.description = itemDescription;

    const viewOptions = {
        localization
    };

    if (gml.getTooltipsEnabled()) {
        viewOptions.tooltips = tooltips;
    }

    const view = new ItemView(item, viewOptions);

    return view;
}

const visualReferenceCompilers = {
    item: compileReferenceItem,
    affliction: compileReferenceAffliction,
    talent: compileReferenceTalent,
    action: compileReferenceAction,
    creature: compileReferenceCreature,
    stat: compileReferenceStat,
    money: compileReferenceMoney
};

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
         */
        function compileTextToken(token) {
            return new LabelView(token.value, { tag: 'span' });
        }

        function compileReferenceToken(token) {
            /**
             * @type {TooltipReferenceValue}
             */
            const reference = token.value;

            const refType = reference.type.toLocaleLowerCase();

            const referenceCompiler = visualReferenceCompilers[refType];

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

            return view;
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
            let childView;
            const tokenType = t.type;

            if (tokenType === TooltipTokenType.Reference) {
                childView = compileReferenceToken(t);
            } else if (tokenType === TooltipTokenType.Text) {
                childView = compileTextToken(t);
            } else if (tokenType === TooltipTokenType.StyleStart) {
                pushStyle(t.value);
            } else if (tokenType === TooltipTokenType.StyleEnd) {
                popStyle(t.value);
            } else {
                throw new TypeError(`Unsupported token type '${tokenType}'`);
            }

            if (childView !== undefined) {
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
