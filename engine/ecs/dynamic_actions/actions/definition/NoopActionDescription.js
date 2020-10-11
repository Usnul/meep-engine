import { AbstractActionDescription } from "./AbstractActionDescription.js";
import { SucceedingBehavior } from "../../../../intelligence/behavior/primitive/SucceedingBehavior.js";

export class NoopActionDescription extends AbstractActionDescription {
    execute(actor, dataset, context, system) {
        return new SucceedingBehavior();
    }

    fromJSON(j) {
        // nothing to parse
    }
}

NoopActionDescription.prototype.type = "Empty";
