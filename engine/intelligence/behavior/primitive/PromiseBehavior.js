import { Behavior } from "../Behavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";

export class PromiseBehavior extends Behavior {
    constructor(factory) {
        super();

        this.__factory = factory;

        this.__promise = null;
    }

    initialize(context) {
        super.initialize(context);

        this.__promise = this.__factory();

        this.__promise.then(
            () => {
                this.setStatus(BehaviorStatus.Succeeded);
            },
            () => {
                this.setStatus(BehaviorStatus.Failed);
            }
        );
    }

    tick(timeDelta) {
        return this.__status;
    }
}
