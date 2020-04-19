import View from "../../View.js";
import LabelView from "../../common/LabelView.js";
import EmptyView from "../../elements/EmptyView.js";
import Vector1 from "../../../core/geom/Vector1.js";
import ObservedString from "../../../core/model/ObservedString.js";

export class StatValueView extends View {
    /**
     *
     * @param {Stat} stat
     * @param {string} tag
     * @param {string} [unit]
     */
    constructor(stat, { tag = 'div', unit } = {}) {
        super();

        this.el = document.createElement(tag);
        this.addClass('ui-combat-unit-stat-value-view');

        this.addChild(new LabelView(stat, { classList: ['total'], tag: 'span' }));

        if (unit !== undefined) {
            this.addChild(new LabelView(unit, { classList: ['unit'], tag: 'span' }));
        }

        const vBreakdown = new EmptyView({ classList: ['breakdown'], tag: 'span' });

        this.addChild(vBreakdown);

        const delta = new Vector1();

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

            const t = stat.base.getValue() * a + b;


            const d = t - stat.base.getValue();
            delta.set(Math.abs(d));

            if (d < 0) {
                sSign.set('-');
            } else {
                sSign.set('+');
            }

            lDeltaConstant.setClass('negative', d < 0);

            // flag as identity breakdown
            vBreakdown.setClass('identity', d === 0);
        }

        //add base value
        vBreakdown.addChild(new LabelView('(', { tag: 'span' }));

        vBreakdown.addChild(new LabelView(stat.base, {
            tag: 'span',
            classList: ['base-value']
        }));

        const sSign = new ObservedString('+');

        vBreakdown.addChild(new LabelView(sSign, { tag: 'span', classList: ['addition-sign'] }));

        const lDeltaConstant = new LabelView(delta, {
            tag: 'span',
            classList: ['constant'],
        });
        vBreakdown.addChild(lDeltaConstant);

        vBreakdown.addChild(new LabelView(')', { tag: 'span' }));


        this.on.linked.add(updateModifierValues);
        this.bindSignal(stat.modifiers.on.added, updateModifierValues);
        this.bindSignal(stat.modifiers.on.removed, updateModifierValues);
    }
}
