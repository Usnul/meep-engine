import { Behavior } from "../Behavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";
import { assert } from "../../../../core/assert.js";

export class ActionBehavior extends Behavior {
    /**
     *
     * @param {function} action
     * @param {*} [context]
     */
    constructor(action, context) {
        super();

        assert.typeOf(action, 'function', "action");

        this.__action = action;
        this.__context = context;
    }

    tick(timeDelta) {

        if (this.__status === BehaviorStatus.Running) {
            this.__action.call(this.__context, timeDelta);
        }

        this.__status = BehaviorStatus.Succeeded;

        return this.__status;
    }
}
