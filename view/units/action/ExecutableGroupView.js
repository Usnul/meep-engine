import View from "../../View.js";
import { makeActionExecutableView } from "./makeActionExecutableView.js";

export class ExecutableGroupView extends View {
    /**
     *
     * @param {ExecutableGroup} model
     * @param {string} [tag]
     * @param {GMLEngine} gml
     * @param {Localization} localization
     */
    constructor({ model, tag = 'div', gml, localization }) {
        super();

        this.el = document.createElement(tag);

        this.addClass('ui-executable-group-view');

        model.elements.forEach(o => {
            const view = makeActionExecutableView({ executable: o, gml, localization });

            this.addChild(view);
        });
    }
}
