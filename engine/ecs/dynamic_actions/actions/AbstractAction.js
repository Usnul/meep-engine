export class AbstractAction {
    constructor() {
    }

    /**
     * Main entry point
     * @param {number} actor Entity ID of the actor
     * @param {EntityComponentDataset} dataset
     * @param context
     */
    execute(actor, dataset, context) {

    }
}

AbstractAction.prototype.type = '$Abstract';
