import View from "../View.js";
import LabelView from "../common/LabelView.js";
import EmptyView from "../elements/EmptyView.js";

export class CurrencyDenominationLabelView extends View {
    /**
     *
     * @param {number} value
     * @param {CurrencyDenominationSpec} denomination
     */
    constructor({ value, denomination }) {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-currency-denomination-label-view');
        this.addClass(`denomination-${denomination.id}`);


        this.addChild(new LabelView(value, { classList: ['value'] }));
        this.addChild(new EmptyView({ classList: ['icon'] }));
    }
}
