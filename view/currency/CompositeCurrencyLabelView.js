import View from "../View.js";
import { CurrencyDenominationLabelView } from "./CurrencyDenominationLabelView.js";

export class CompositeCurrencyLabelView extends View {
    /**
     *
     * @param {ObservedInteger} value
     * @param {CurrencyDisplaySpec} spec
     * @param {string[]} [classList]
     */
    constructor({ value, spec, classList = [] }) {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-composite-currency-label-view');

        this.value = value;
        this.spec = spec;

        this.addClasses(classList);

        this.bindSignal(value.onChanged, this.update, this);
        this.on.linked.add(this.update, this);
    }

    update() {
        this.removeAllChildren();

        const value = this.value.getValue();
        let remainder = Math.abs(value);

        this.setClass('negative', value < 0);
        this.setClass('positive', value > 0);

        const spec = this.spec;

        const denominations = spec.denominations;
        const denominationCount = denominations.length;

        for (let i = 0; i < denominationCount; i++) {
            const denomination = denominations[i];

            const v = (remainder / denomination.value) | 0;

            if (v === 0) {
                continue;
            }

            remainder -= v * denomination.value;

            const vDenomination = new CurrencyDenominationLabelView({ value: v, denomination });

            this.addChild(vDenomination);
        }
    }
}
