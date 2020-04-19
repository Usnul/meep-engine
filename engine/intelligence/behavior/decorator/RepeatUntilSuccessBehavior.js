import { AbstractDecoratorBehavior } from "./AbstractDecoratorBehavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";

export class RepeatUntilSuccessBehavior extends AbstractDecoratorBehavior {

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
         * @type {Behavior}
         * @private
         */
        this.__source = source;

        /**
         *
         * @type {number}
         * @private
         */
        this.__iterator = 0;
    }

    /**
     *
     * @param {Behavior} source
     * @param {number} [limit]
     * @return {RepeatUntilSuccessBehavior}
     */
    static from(source, limit = Infinity) {
        const r = new RepeatUntilSuccessBehavior();

        r.setSource(source);
        r.__limit = limit;

        return r;
    }

    tick(timeDelta) {
        const s = this.__source.tick(timeDelta);

        if (s === BehaviorStatus.Succeeded) {

            this.__status = s;

            return s;

        } else if (s === BehaviorStatus.Running) {
            return s;
        }

        this.__iterator++;

        if (this.__iterator >= this.__limit) {
            this.__status = BehaviorStatus.Failed;

            return this.__status;
        } else {
            //re-initialize the source behavior
            this.__source.initialize(this.context);

            return BehaviorStatus.Running;
        }
    }
}
