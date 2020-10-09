import { AbstractActionDescription } from "./AbstractActionDescription.js";
import { AsynchronousDelayAction } from "../../../../../core/process/action/AsynchronousDelayAction.js";

export class DelayActionDescription extends AbstractActionDescription {
    constructor() {
        super();

        this.time = 0;
    }

    execute(actor, dataset, context, system) {
        return new AsynchronousDelayAction(dataset, this.time);
    }

    fromJSON({ time }) {

        this.time = time;

    }
}


DelayActionDescription.prototype.type = "Delay";
