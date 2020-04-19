import View from "../../View.js";
import { prettyPrint } from "../../../core/NumberFormat.js";
import { makeActionExecutableView } from "./makeActionExecutableView.js";

export class OptionExecutionProbabilityView extends View {
    /**
     *
     * @param {OptionExecutionProbability} model
     * @param {string} [tag]
     * @param {GMLEngine} gml
     * @param {Localization} localization
     */
    constructor({ model, tag = 'div', gml, localization }) {
        super();

        this.el = document.createElement(tag);

        this.addClass('ui-option-execution-probability-view');

        this.addChild(
            gml.compile(
                localization.getString(
                    `system.action_execution.option_probability`,
                    {
                        percent: prettyPrint(model.chance * 100)
                    }
                )
            )
        );

        this.addChild(makeActionExecutableView({ executable: model.action, gml, localization }));
    }
}
