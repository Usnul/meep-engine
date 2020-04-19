import { EditorProcess } from "../EditorProcess.js";
import { EntityObserver } from "../../../engine/ecs/EntityObserver.js";

export class ComponentSymbolicDisplay extends EditorProcess {
    constructor(components, creator, destructor) {
        super();

        /**
         *
         * @type {EntityObserver}
         */
        this.observer = new EntityObserver(components, creator, destructor);
    }

    startup() {
        super.startup();

        /**
         *
         * @type {EntityComponentDataset}
         */
        const dataset = this.editor.engine.entityManager.dataset;

        dataset.addObserver(this.observer, true);
    }

    shutdown() {
        super.shutdown();

        const dataset = this.editor.engine.entityManager.dataset;

        dataset.removeObserver(this.observer, true);
    }
}
