export class AbstractActionDescription {
    constructor() {
    }

    /**
     * Main entry point
     * @param {number} actor Entity ID of the actor
     * @param {EntityComponentDataset} dataset
     * @param context
     * @param {DynamicActorSystem} system
     * @returns {AsynchronousAction}
     */
    execute(actor, dataset, context, system) {
        throw new Error('niy');
    }

    fromJSON(j) {
        throw new Error('niy');
    }
}

AbstractActionDescription.prototype.type = '$Abstract';
