import { CompositeBehavior } from "../composite/CompositeBehavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";

export class SelectorBehavior extends CompositeBehavior {
    constructor() {
        super();

        this.__index = 0;
    }

    /**
     *
     * @param {Behavior[]} children
     * @return {SelectorBehavior}
     */
    static from(children) {
        const r = new SelectorBehavior();

        r.__children = children.slice();

        return r;
    }

    tick(timeDelta) {

        while (true) {
            const child = this.__children[this.__index];

            const s = child.tick(timeDelta);

            //if child succeeds or keeps running, do the same
            if (s !== BehaviorStatus.Failed) {
                this.__status = s;
                return s;
            }


            //continue search for fallback behavior until the last child
            this.__index++;

            if (this.__index >= this.__children.length) {
                this.__status = BehaviorStatus.Failed;
                return this.__status;
            }

            //initialize new child
            const next = this.__children[this.__index];

            child.finalize();
            next.initialize(this.context);
        }

        //we should never reach this point
        this.__status = BehaviorStatus.Invalid;
        return this.__status;
    }

    finalize() {
        super.finalize();

        if (this.__children.length > 0) {
            const b = this.__children[this.__index];

            b.finalize();
        }
    }


    initialize(context) {
        super.initialize(context);

        this.__index = 0;

        if (this.__children.length > 0) {
            this.__children[0].initialize(context);
        } else {
            //empty, resolve as succeeded straight away
            this.__status = BehaviorStatus.Succeeded;
        }
    }

}
