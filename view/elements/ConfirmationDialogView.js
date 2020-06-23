/**
 * Created by Alex on 07/09/2016.
 */


import View from "../View.js";
import dom from "../DOM.js";
import ButtonView from "./button/ButtonView.js";
import EmptyView from "./EmptyView.js";

/**
 * @typedef {Object} ConfirmationDialogView~Option
 * @property {string} name
 * @property {string} displayName
 * @property {function} callback
 * @property {ObservedBoolean|ReactiveExpression} [enabled]
 */

class ConfirmationDialogView extends View {
    /**
     * @param {View} content
     * @param {Array.<ConfirmationDialogView~Option>} options
     * @constructor
     */
    constructor(content, options) {
        super();

        const dRoot = dom("div").addClass("ui-confirmation-dialog-view");

        this.el = dRoot.el;

        const vContentContainer = new EmptyView({ classList: ['content-container'] });
        vContentContainer.addChild(content);
        this.addChild(vContentContainer);

        const vButtonArea = new EmptyView({ classList: ['button-area'] });

        const optionCount = options.length;

        for (let i = 0; i < optionCount; i++) {
            const option = options[i];

            const className = "button-" + option.name.replace(' ', '-');

            const name = option.displayName;

            const vButton = new ButtonView({
                name,
                action: function (event) {
                    event.stopPropagation();
                    option.callback(event);
                },
                classList: [className, "ui-confirmation-dialog-button", 'ui-button-rectangular']
            });

            /**
             *
             * @type {ObservedBoolean|ReactiveExpression}
             */
            const enabled = option.enabled;

            if (enabled !== undefined) {
                const update = () => vButton.enabled = enabled.getValue();

                vButton.on.linked.add(update)

                vButton.bindSignal(enabled.onChanged, update);
            }

            vButton.size.set(115, 36);

            vButtonArea.addChild(vButton);
        }

        this.addChild(vButtonArea);
    }
}


export default ConfirmationDialogView;
