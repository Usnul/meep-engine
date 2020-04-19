import View from "../../View.js";
import LabelView from "../../common/LabelView.js";
import { isValueBetween } from "../../../core/math/MathUtils.js";

export class SimpleStatValueView extends View {
    /**
     *
     * @param {Stat} stat
     * @param {string} tag
     * @param {string} [unit]
     */
    constructor(stat, { tag = 'div', unit } = {}) {
        super();

        this.el = document.createElement(tag);
        this.addClass('ui-combat-unit-simple-stat-value-view');

        this.addChild(new LabelView(stat, {
            classList: ['total'], tag: 'span', transform(v) {
                return Math.round(v);
            }
        }));

        if (unit !== undefined) {
            this.addChild(new LabelView(unit, { classList: ['unit'], tag: 'span' }));
        }

        const self = this;

        function updateModifierValues() {

            const modifiers = stat.modifiers;

            let a = 1;
            let b = 0;

            let i;

            const l = modifiers.length;
            const modifiersData = modifiers.data;

            // Combine all modifiers
            for (i = 0; i < l; i++) {
                const m = modifiersData[i];

                a += (m.a - 1);
                b += m.b;
            }

            const baseValue = stat.base.getValue();
            const t = baseValue * a + b;

            const d = t - baseValue;

            let f = 0;

            if (d < 0) {
                f = baseValue / t;
            } else {
                f = t / baseValue;
            }

            self.setClass('increased', d > 0);
            self.setClass('reduced', d < 0);

            self.setClass('level-0', isValueBetween(f, 1.2, 1.5));
            self.setClass('level-1', isValueBetween(f, 1.5, 2) || f === 1.5);
            self.setClass('level-2', f >= 2);

            // flag as identity breakdown
            self.setClass('identity', d === 0);
        }


        this.on.linked.add(updateModifierValues);
        this.bindSignal(stat.modifiers.on.added, updateModifierValues);
        this.bindSignal(stat.modifiers.on.removed, updateModifierValues);
    }
}
