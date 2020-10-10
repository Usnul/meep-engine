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

            try {
                this.__action.call(this.__context, timeDelta);

                this.setStatus(BehaviorStatus.Succeeded);

            } catch (e) {

                this.setStatus(BehaviorStatus.Failed);

            }

        }


        return this.__status;
    }
}
