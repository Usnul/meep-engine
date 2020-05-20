import View from "../View.js";
import ObservedBoolean from "../../core/model/ObservedBoolean.js";
import EmptyView from "../elements/EmptyView.js";

class TabDefinition {
    constructor() {
        /**
         *
         * @type {ObservedBoolean}
         */
        this.enabled = new ObservedBoolean(true);

        /**
         *
         * @type {ObservedBoolean}
         */
        this.active = new ObservedBoolean(false);

        /**
         *
         * @type {View}
         */
        this.toggle = null;

        /**
         *
         * @type {View}
         */
        this.panel = null;
    }
}

export class TabbedView extends View {

    /**
     *
     * @param {List<TabDefinition>} tabs
     * @param {TabDefinition} [active]
     */
    constructor({ tabs }) {
        super();

        /**
         *
         * @type {List<TabDefinition>}
         */
        this.model = tabs;

        this.el = document.createElement('div');

        this.bindSignal(tabs.on.added, this.__handleTabAdded, this);
        this.bindSignal(tabs.on.removed, this.__handleTabRemoved, this);

        this.__panelContainer = new EmptyView({ classList: ['panel-container'] })

        this.__toggleContainer = new EmptyView({ classList: ['toggle-container'] });
    }


    link() {
        super.link();

        this.__panelContainer.removeAllChildren();
        this.__toggleContainer.removeAllChildren();

        this.model.forEach(this.__handleTabAdded, this);
    }

    unlink() {
        this.model.forEach(this.__handleTabRemoved, this);

        super.unlink();
    }

    /**
     *
     * @private
     */
    __updateActivateTab() {
        this.__panelContainer.removeAllChildren();


        const n = this.model.length;
        for (let i = 0; i < n; i++) {
            const tabDefinition = this.model.get(i);

            if (tabDefinition.active.getValue()) {
                this.__panelContainer.addChild(tabDefinition.panel);
                break;
            }
        }

    }


    /**
     *
     * @param {TabDefinition} definition
     * @private
     */
    __handleTabAdded(definition) {
        //add toggle
        this.__toggleContainer.addChild(definition.toggle);

        if (definition.active.getValue()) {
            this.__updateActivateTab();
        }

        definition.active.onChanged.add(this.__updateActivateTab, this);
    }

    /**
     *
     * @param {TabDefinition} definition
     * @private
     */
    __handleTabRemoved(definition) {
        this.__toggleContainer.removeChild(definition.toggle);

        if (definition.active.getValue()) {
            this.__panelContainer.removeChild(definition.panel);
        }

        definition.active.onChanged.remove(this.__updateActivateTab, this);
    }
}
