import { Action } from "../Action.js";

class EntityCreateAction extends Action {
    /**
     * Created by Alex on 16/01/2017.
     */
    constructor() {
        super();
        /**
         *
         * @type {number|null}
         */
        this.entity = null;

        /**
         *
         * @type {EntityComponentDataset}
         */
        this.ecd = null;
    }

    apply(editor) {
        if (this.ecd === null) {
            /**
             * @type {EntityManager}
             */
            const em = editor.engine.entityManager;

            const ecd = em.dataset;

            this.ecd = ecd;
        }


        if (this.entity === null) {
            this.entity = this.ecd.createEntity();
        } else {
            this.ecd.createEntitySpecific(this.entity);
        }
    }

    revert(editor) {
        this.ecd.removeEntity(this.entity);
    }
}

export default EntityCreateAction;
