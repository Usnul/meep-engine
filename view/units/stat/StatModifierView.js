import View from "../../View.js";
import domify from "../../DOM.js";
import LabelView from "../../common/LabelView.js";

/**
 *
 * @param {number} v
 * @returns {number | string}
 */
function formatNumber(v) {
    let result;

    const minPrecision = 0.01;

    const errorMargin = Math.abs(v - Math.round(v));

    if (errorMargin > minPrecision) {
        //there is a fractional part
        result = v.toFixed(2);
    } else {
        result = Math.round(v);
    }

    return result;
}

export class StatModifierView extends View {
    /**
     *
     * @param {StatModifier} model
     * @param {Localization} localization
     * @param {GMLEngine} gml
     */
    constructor(model, { localization, gml }) {
        super();


        this.model = model;

        const dRoot = domify();

        dRoot.addClass('ui-combat-unit-stat-modifier');

        this.el = dRoot.el;

        /**
         *
         * @type {string}
         */
        const statId = model.stat;

        function statName() {


            let key = `system_combat_unit_stat.${statId}.name.case.genitive`;

            if (!localization.hasString(key)) {
                //drop the case
                key = `system_combat_unit_stat.${statId}.name`;
            }

            return localization.getString(key);
        }

        /**
         *
         * @type {LinearModifier}
         */
        const modifier = model.modifier;

        const self = this;

        function makeLabel(text, classList) {
            const localizedLabel = localization.getString('system_combat_unit_stat_display', {
                value: text,
                name: statName()
            });
            const label = gml.compile(localizedLabel);

            classList.forEach(c => label.addClass(c));

            self.addChild(label);
        }

        function includePercent() {
            return modifier.a !== 1;
        }

        if (includePercent()) {
            let valueText;
            const percentValue = (modifier.a - 1) * 100;
            const formattedValue = formatNumber(percentValue);

            if (modifier.a > 1) {
                valueText = `+${formattedValue}%`;
            } else {
                valueText = `${formattedValue}%`
            }

            const classList = ['percent'];

            if (percentValue < 0) {
                classList.push('negative');
            }

            makeLabel(valueText, classList);
        }

        if (modifier.b !== 0) {

            if (includePercent()) {
                this.addChild(new LabelView(localization.getString('system_list_delimiter_and'), { classList: ['and'] }));
            }

            let valueText;
            const value = modifier.b;
            const formattedValue = formatNumber(value);

            if (value > 0) {
                valueText = `+${formattedValue}`;
            } else {
                valueText = `${formattedValue}`
            }

            const classList = ['fixed'];

            if (value < 0) {
                classList.push('negative');
            }

            makeLabel(valueText, classList);
        }
    }
}
