import ObservedEnum from "../model/ObservedEnum.js";
import { ProcessState } from "./ProcessState.js";
import { IllegalStateException } from "../fsm/exceptions/IllegalStateException.js";
import { objectKeyByValue } from "../model/ObjectUtils.js";

export class BaseProcess {
    constructor() {
        this.id = "";
        /**
         * @readonly
         * @type {ObservedEnum.<ProcessState>}
         */
        this.state = new ObservedEnum(ProcessState.New, ProcessState);
    }

    initialize() {

        const currentState = this.state.getValue();

        if (currentState !== ProcessState.New && currentState !== ProcessState.Finalized) {
            throw new IllegalStateException(`Expected New or Finalized state, instead got ${objectKeyByValue(ProcessState, currentState)}`);
        }


        this.state.set(ProcessState.Initialized);

    }

    finalize() {
        this.state.set(ProcessState.Finalized);
    }

    startup() {
        const currentState = this.state.getValue();

        if (currentState !== ProcessState.Initialized && currentState !== ProcessState.Stopped) {
            throw new IllegalStateException(`Expected Initial state, instead got ${objectKeyByValue(ProcessState, currentState)}`);
        }

        this.state.set(ProcessState.Running);
    }

    shutdown() {
        this.state.set(ProcessState.Stopped);
    }
}
