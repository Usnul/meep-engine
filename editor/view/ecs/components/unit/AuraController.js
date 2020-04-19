import View from "../../../../../view/View.js";
import ImageView from "../../../../../view/elements/image/ImageView.js";
import ButtonView from "../../../../../view/elements/button/ButtonView.js";
import { LocalizedLabelView } from "../../../../../view/common/LocalizedLabelView.js";

/**
 * @extends {View}
 */
export class AuraController extends View {
    /**
     *
     * @param {Aura} aura
     * @param {function} requestRemoval
     * @param {Localization} localization
     */
    constructor({ aura, requestRemoval, localization }) {
        super();

        this.model = aura;

        this.el = document.createElement('div');
        this.addClass('ui-aura-controller');

        /**
         *
         * @type {AfflictionDescription}
         */
        const affliction = aura.affliction;

        const iconView = new ImageView(affliction.icon);
        iconView.addClass('icon');

        this.addChild(iconView);

        this.addChild(new ButtonView({ action: requestRemoval, name: '', classList: ['remove'] }));

        const lName = new LocalizedLabelView({
            id: affliction.getLocalizationIdForName(),
            localization,
            classList: ["name"]
        });

        this.addChild(lName);
    }
}
