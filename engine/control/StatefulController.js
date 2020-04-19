import { SimpleStateMachine } from "../../core/fsm/simple/SimpleStateMachine.js";

export class StatefulController {
    /**
     *
     * @param {SimpleStateMachine} sm
     */
    constructor(sm) {
        /**
         *
         * @type {SimpleStateMachine}
         */
        this.sm = sm;

        /**
         *
         * @type {ControlContext[]}
         */
        this.contexts = [];
    }

    /**
     *
     * @param {number} state
     * @param {ControlContext} context
     */
    addContext(state, context) {
        this.sm.addEventHandlerStateEntry(state, context.startup, context);
        this.sm.addEventHandlerStateExit(state, context.shutdown, context);
    }

    /**
     *
     * @param {number} state
     * @param {ControlContext} context
     */
    removeContext(state, context){
        this.sm.removeEventHandlerStateEntry(state, context.startup, context);
        this.sm.removeEventHandlerStateExit(state, context.shutdown, context);
    }


}
