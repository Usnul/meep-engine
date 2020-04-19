import View from "../../View.js";
import LabelView from "../../common/LabelView.js";
import Vector1 from "../../../core/geom/Vector1.js";
import { prettyPrint } from "../../../core/NumberFormat.js";
import ObservedString from "../../../core/model/ObservedString.js";
import { chainFunctions } from "../../../core/function/Functions.js";


function formatNumberExplicitSigned(v) {
    const a = prettyPrint(Math.abs(v));

    const t = (v > 0 ? '+' : '-') + a;
    return t;
}

export class StatValueLinearBreakdownView extends View {
    /**
     *
     * @param {Stat} stat
     * @param {string} tag
     */
    constructor(stat, { tag = 'div' } = {}) {
        super();

        this.el = document.createElement(tag);
        this.addClass('ui-combat-unit-stat-value-linear-breakdown-view');


        const multiplier = new Vector1();
        const constant = new Vector1();


        const updateModifierValues = () => {

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

            multiplier.set(a);
            constant.set(b);

            lConstant.setClass('negative', b < 0);
            lMultiplier.setClass('negative', a < 1);

            // flag as identity breakdown
            this.setClass('identity-multiplier', a === 1);
            this.setClass('identity-constant', b === 0);

            this.setClass('negative-multiplier', a < 1);

            this.setClass('identity', a === 1 && b === 0);
        };

        const sSign = new ObservedString('+');

        //add base value
        this.addChild(new LabelView(stat.base, {
            tag: 'span',
            classList: ['base-value']
        }));

        const lMultiplier = new LabelView(multiplier, {
            tag: 'span',
            classList: ['multiplier', 'modifier-value'],
            transform(v) {
                return (v - 1) * 100;
            },
            format: chainFunctions(formatNumberExplicitSigned, (t) => `${t}%`)
        });

        this.addChild(lMultiplier);

        const lConstant = new LabelView(constant, {
            tag: 'span',
            classList: ['constant', 'modifier-value'],
            format: formatNumberExplicitSigned
        });
        this.addChild(lConstant);

        this.on.linked.add(updateModifierValues);
        this.bindSignal(stat.modifiers.on.added, updateModifierValues);
        this.bindSignal(stat.modifiers.on.removed, updateModifierValues);
    }
}
