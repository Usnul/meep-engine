import View from "../View.js";

export class AuraDescriptionView extends View {
    /**
     *
     * @param {Aura} model
     * @param {GMLEngine} gml
     * @param {Localization} localization
     */
    constructor(model, { gml, localization }) {
        super();

        this.el = document.createElement('div');

        const tip = model.getLocalizedTip(localization);

        gml.compile(tip, this);

    }
}
