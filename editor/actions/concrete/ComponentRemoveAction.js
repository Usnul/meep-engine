import { Action } from "../Action.js";

/**
 * Created by Alex on 16/01/2017.
 * TODO update
 */
class ComponentRemoveAction extends Action {
    constructor(entity, componentType) {
        super();

        this.entity = entity;
        this.componentType = componentType;
        this.component = null;
    }

    apply(editor) {
        /**
         * @type {Engine}
         */
        const engine = editor.engine;

        const em = engine.entityManager;

        /**
         * @type {EntityComponentDataset}
         */
        const ecd = em.dataset;

        this.component = ecd.removeComponentFromEntity(this.entity, this.componentType);
    }

    revert(editor) {
        const em = editor.engine.entityManager;
        em.addComponentToEntity(this.entity, this.component);
    }
}

export default ComponentRemoveAction;
