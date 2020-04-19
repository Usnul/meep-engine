import ImageView from "../../../../../view/elements/image/ImageView.js";
import { LocalizedLabelView } from "../../../../../view/common/LocalizedLabelView.js";
import ButtonView from "../../../../../view/elements/button/ButtonView.js";
import View from "../../../../../view/View.js";
import { NumberController } from "../common/NumberController.js";

export class ItemController extends View {
    /**
     *
     * @param {Item} item
     * @param {Localization} localization
     * @param {function} requestRemoval
     */
    constructor({ item, localization, requestRemoval }) {
        super();

        this.model = item;

        this.el = document.createElement('div');
        this.addClass('ui-item-controller');

        /**
         *
         * @type {ItemDescription}
         */
        const itemDescription = item.description;

        const iconView = new ImageView(itemDescription.icon);
        iconView.addClass('icon');

        this.addChild(iconView);

        const vCount = new NumberController({ classList: ['count'] });

        this.addChild(vCount);

        this.addChild(new ButtonView({ action: requestRemoval, name: '', classList: ['remove'] }));

        vCount.value.set(item.count.getValue());
        this.bindSignal(item.count.onChanged, v => vCount.value.set(v));
        this.bindSignal(vCount.value.onChanged, v => item.count.set(v));

        const lName = new LocalizedLabelView({
            id: itemDescription.getLocalizationKeyName(),
            localization,
            classList: ["name"]
        });

        this.addChild(lName);

    }
}
