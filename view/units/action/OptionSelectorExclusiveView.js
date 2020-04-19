import View from "../../View.js";
import { OptionExecutionProbabilityView } from "./OptionExecutionProbabilityView.js";
import EmptyView from "../../elements/EmptyView.js";

export class OptionSelectorExclusiveView extends View {
    /**
     *
     * @param {OptionSelectorExclusive} model
     * @param {string} [tag]
     * @param {GMLEngine} gml
     * @param {Localization} localization
     */
    constructor({ model, tag = 'div', gml, localization }) {
        super();

        this.el = document.createElement(tag);

        this.addClass('ui-option-selector-view');
        this.addClass('ui-option-selector-exclusive-view');

        this.addChild(
            gml.compile(
                localization.getString(
                    `system.action_execution.option_selector_exclusive.intro`
                )
            )
        );

        const vOptions = new EmptyView({ classList: ['options'] });
        this.addChild(vOptions);

        model.options.forEach(o => {
            const view = new OptionExecutionProbabilityView({ model: o, gml, localization });

            vOptions.addChild(view);
        });
    }
}
