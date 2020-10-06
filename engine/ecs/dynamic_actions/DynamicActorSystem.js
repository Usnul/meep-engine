import { DynamicActor } from "./DynamicActor.js";
import { AbstractContextSystem } from "../system/AbstractContextSystem.js";
import { SystemEntityContext } from "../system/SystemEntityContext.js";

class Context extends SystemEntityContext {

    /**
     *
     * @param {string} event
     * @param {*} data Event data
     */
    handle(event, data) {

    }

    link() {
        const ecd = this.getDataset();

        ecd.addEntityAnyEventListener(this.entity, this.handle, this);
    }

    unlink() {
        const ecd = this.getDataset();

        ecd.removeAnyEventListener(this.entity, this.handle, this);
    }
}

export class DynamicActorSystem extends AbstractContextSystem {
    constructor() {
        super(Context);

        this.dependencies = [DynamicActor];
    }
}
