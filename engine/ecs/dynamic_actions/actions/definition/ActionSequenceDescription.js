import { AbstractActionDescription } from "./AbstractActionDescription.js";
import { AsynchronousActionSequence } from "../../../../../core/process/action/AsynchronousActionSequence.js";

export class ActionSequenceDescription extends AbstractActionDescription {
    constructor() {
        super();

        /**
         *
         * @type {AbstractActionDescription[]}
         */
        this.elements = [];
    }

    execute(actor, dataset, context, system) {
        const sequence = this.elements.map(e => {
            return e.execute(actor, dataset, context, system);
        });

        return new AsynchronousActionSequence(sequence);
    }
}
