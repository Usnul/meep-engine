import View from "../../../view/View.js";
import Signal from "../../../core/events/signal/Signal.js";
import dom from "../../../view/DOM.js";
import ObservedBoolean from "../../../core/model/ObservedBoolean.js";
import LabelView from "../../../view/common/LabelView.js";
import ButtonView from "../../../view/elements/button/ButtonView.js";
import EmptyView from "../../../view/elements/EmptyView.js";
import GuiControl from "../../../view/controller/controls/GuiControl.js";

/**
 * @template T
 */
export class ComponentControlView extends View {
    /**
     * @template T
     * @param {number} entity
     * @param {T} component
     * @param {EntityManager} entityManager
     * @param {ComponentControlFactory} factory
     * @constructor
     */
    constructor(entity, component, entityManager, factory) {
        super();

        this.signal = {
            remove: new Signal()
        };

        const dRoot = dom('div');

        dRoot.addClass('entity-editor-component-control-view');

        this.el = dRoot.el;

        const folded = this.folded = new ObservedBoolean(false);

        const componentType = component.constructor;
        const typeName = componentType.typeName;

        const vComponentName = new LabelView(typeName);

        const bFold = new ButtonView({
            classList: ['fold-toggle'],
            action() {
                folded.invert();
            }
        });

        const bRemove = new ButtonView({
            classList: ['remove'],
            action() {
                self.signal.remove.dispatch();
            }
        });

        const bCopy = new ButtonView({
            classList: ['copy'],
            action() {
                const json = component.toJSON();

                const data = JSON.stringify({
                    type: typeName,
                    data: json
                }, 3, 3);

                navigator.clipboard.writeText(data).then(
                    () => console.log(`${entity}:${typeName} copied to clip`)
                );
            }
        });

        bCopy.setClass('disabled', component.hasOwnProperty('toJSON') && typeof component.toJSON !== "function");

        const bPaste = new ButtonView({
            classList: ['paste'],
            action() {
                navigator.clipboard.readText().then(text => {
                    const json = JSON.parse(text);

                    if (json.type !== typeName) {
                        throw new Error(`Component type(=${json.type}) in clipboard does not match current component type(=${typeName})`);
                    }

                    //get system
                    const system = entityManager.getOwnerSystemByComponentClass(componentType);

                    component.fromJSON(json.data, system);

                    console.log(`${entity}:${typeName} pasted from clip`);
                });
            }
        });

        bPaste.setClass('disabled', component.hasOwnProperty('fromJSON') && typeof component.fromJSON !== "function");

        const vTitleBar = new EmptyView();
        dom(vTitleBar.el).addClass('title-bar');

        vTitleBar.addChild(vComponentName);
        vTitleBar.addChild(bCopy);
        vTitleBar.addChild(bPaste);
        vTitleBar.addChild(bFold);
        vTitleBar.addChild(bRemove);

        this.addChild(vTitleBar);

        let vController;

        function buildPlaceholderController(message) {
            const labelView = new LabelView(message);
            labelView.el.classList.add(GuiControl.CSS_CLASS_NAME);
            return labelView;
        }

        //build controller
        if (!factory.exists(typeName)) {
            //no controller factory for this type
            vController = buildPlaceholderController('No Controller Implemented');
            //fold, not useful to display
            this.folded.set(true);
        } else {
            try {
                vController = factory.create(typeName);
                vController.entity = entity;
                vController.entityManager = entityManager;

                vController.model.set(component);
            } catch (e) {
                vController = buildPlaceholderController(`Exception thrown during controller build: ${e}`);
                console.error(e);
            }
        }

        const self = this;

        folded.process(function (v) {

            dRoot.setClass('folded', v);

            if (v) {
                self.removeChild(vController);
            } else {
                self.addChild(vController);
            }
        });
    }
}
