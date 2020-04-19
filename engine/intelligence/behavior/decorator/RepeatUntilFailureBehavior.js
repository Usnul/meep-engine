import { Behavior } from "../Behavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";
import { AbstractDecoratorBehavior } from "./AbstractDecoratorBehavior.js";

/**
 * @extends {Behavior}
 */
export class RepeatUntilFailureBehavior extends AbstractDecoratorBehavior {
    /**
     *
     * @param {Behavior} source
     * @param {number} [count=Infinity]
     */
    constructor(source, count = Infinity) {
        super();

        /**
         *
         * @type {number}
         * @private
         */
        this.__limit = count;

        /**
         *
         * @type {number}
         * @private
         */
        this.__iterator = 0;

        this.setSource(source);
    }

    /**
     *
     * @returns {RepeatUntilFailureBehavior}
     * @param {Behavior} source
     * @param {number} [limit]
     */
    static from(source, limit = Infinity) {
        const r = new RepeatUntilFailureBehavior();

        r.setSource(source);
        r.__limit = limit;

        return r;
    }

    tick(timeDelta) {
        const s = this.__source.tick(timeDelta);

        if (s !== BehaviorStatus.Succeeded) {

            this.__status = s;

            return s;

        }

        this.__iterator++;

        if (this.__iterator >= this.__limit) {
            this.__status = BehaviorStatus.Succeeded;

            return BehaviorStatus.Succeeded;
        } else {
            //re-initialize the source behavior
            this.__source.initialize(this.context);

            return BehaviorStatus.Running;
        }
    }
}
