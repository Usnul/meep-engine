import { AbstractDecoratorBehavior } from "./AbstractDecoratorBehavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";

export class IgnoreFailureBehavior extends AbstractDecoratorBehavior {
    /**
     *
     * @param {Behavior} source
     * @return {IgnoreFailureBehavior}
     */
    static from(source) {
        const r = new IgnoreFailureBehavior();

        r.setSource(source);

        return r;
    }

    tick(timeDelta) {
        const behaviorStatus = this.__source.tick(timeDelta);

        if (behaviorStatus === BehaviorStatus.Failed) {
            this.setStatus(BehaviorStatus.Succeeded);
        } else {
            this.setStatus(behaviorStatus);
        }

        return this.getStatus();
    }
}
