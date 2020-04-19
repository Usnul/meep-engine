import View from "../../View.js";
import domify from "../../DOM.js";
import TokenType from "../../../core/parser/simple/TokenType.js";

export class ActionBindingView extends View {
    /**
     *
     * @param {ActionBinding} model
     * @param {Localization} localization
     * @param {GMLEngine} gml
     */
    constructor(model, { localization, gml }) {
        super();

        const dRoot = domify();

        dRoot.addClass('ui-action-binding');

        this.el = dRoot.el;

        /**
         *
         * @type {UnitAction}
         */
        const action = model.action;

        /**
         *
         * @type {UnitActionDescription}
         */
        const actionDescription = action.description;

        const targetVariableName = model.target;

        //localize target name
        const localizedTargetName = localization.getString(`system_combat_action_binding.target.${targetVariableName}`);

        const actorVariableName = model.actor;
        const localizedActorName = localization.getString(`system_combat_action_binding.target.${actorVariableName}`);

        const parameters = { target: localizedTargetName, actor: localizedActorName };


        action.parameters.forEach((p, index) => {
            const actionParameter = actionDescription.parameters[index];

            let value;

            if (p.name === TokenType.Reference) {

                const referenceName = p.value.map(t => t.value).join('.');

                value = localization.getString(`system_combat_action_binding.reference.name.${referenceName}`, parameters);

            } else {

                value = p.value;

            }

            parameters[actionParameter.name] = value;
        });

        const seededTip = localization.getString(`action.${actionDescription.id}.tip`, parameters);

        gml.compile(seededTip, this);
    }
}
