import { AbstractActionDescription } from "./AbstractActionDescription.js";
import { DelayBehavior } from "../../../../../../model/game/util/behavior/DelayBehavior.js";

export class DelayActionDescription extends AbstractActionDescription {
    constructor() {
        super();

        this.time = 0;
    }

    execute(actor, dataset, context, system) {
        return DelayBehavior.from(this.time);
    }

    fromJSON({ time }) {

        this.time = time;

    }
}


DelayActionDescription.prototype.type = "Delay";
