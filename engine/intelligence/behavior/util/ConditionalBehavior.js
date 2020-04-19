import { AbstractDecoratorBehavior } from "../decorator/AbstractDecoratorBehavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";

export class ConditionalBehavior extends AbstractDecoratorBehavior {
    constructor() {
        super();

        /**
         *
         * @type {Behavior}
         */
        this.condition = null;
    }

    /**
     *
     * @param {Behavior} behavior
     */
    setCondition(behavior) {
        this.condition = behavior;
    }

    tick(timeDelta) {
        const condition = this.condition;
        condition.initialize(this.context);

        const s = condition.tick(timeDelta);


        if (s === BehaviorStatus.Succeeded) {

            condition.finalize();

            const s1 = this.__source.tick(timeDelta);

            this.__status = s1;

        } else if (s === BehaviorStatus.Failed) {
            condition.finalize();

            this.__status = s;

        } else {
            //waiting?
            this.__status = s;
        }

        return this.__status;

    }

    finalize() {
        super.finalize();

        const condition = this.condition;

        if (condition.getStatus() === BehaviorStatus.Running) {
            condition.finalize();
        }
    }

    /**
     *
     * @param {Behavior} condition
     * @param {Behavior} source
     * @return {ConditionalBehavior}
     */
    static from(condition, source) {
        const r = new ConditionalBehavior();

        r.setCondition(condition);
        r.setSource(source);

        return r;
    }
}
