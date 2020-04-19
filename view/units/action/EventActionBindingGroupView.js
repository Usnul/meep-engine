import View from "../../View.js";
import { ActionBindingView } from "../talent/ActionBindingView.js";

export class EventActionBindingGroupView extends View {
    /**
     *
     * @param {EventActionBindingGroup} model
     * @param {GMLEngine} gml
     * @param {Localization} localization
     * @param {string} [tag]
     */
    constructor({ model, gml, localization, tag = 'div' }) {
        super();

        this.el = document.createElement(tag);

        this.addClass('ui-event-action-binding-group-view');

        model.actionBindings.forEach(b => {
            const actionBindingView = new ActionBindingView(b, { localization, gml });
            this.addChild(actionBindingView);
        });
    }
}
