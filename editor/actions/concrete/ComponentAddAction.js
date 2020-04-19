import { Action } from "../Action.js";

class ComponentAddAction extends Action {
    /**
     * Created by Alex on 16/01/2017.
     */
    constructor(entity, component) {
        super();
        this.entity = entity;
        this.component = component;
        /**
         *
         * @type {EntityComponentDataset}
         */
        this.dataset = null;
    }

    apply(editor) {
        /**
         * @type {EntityManager}
         */
        const em = editor.engine.entityManager;

        /**
         *
         * @type {EntityComponentDataset}
         */
        const dataset = em.dataset;

        this.dataset = dataset;

        const clazz = this.component.constructor;

        if (dataset.getComponent(this.entity, clazz)) {
            throw new Error(`entity ${this.entity} already has a '${clazz.typeName}' component`);
        }

        dataset.addComponentToEntity(this.entity, this.component);
    }

    revert(editor) {
        const clazz = this.component.constructor;
        this.dataset.removeComponentFromEntity(this.entity, clazz);
    }
}

export default ComponentAddAction;
