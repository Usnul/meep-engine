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
        this.__state = new ObservedEnum(ProcessState.New, ProcessState);
    }

    /**
     * @returns {ObservedEnum<ProcessState>}
     */
    getState() {
        return this.__state;
    }

    initialize() {

        const currentState = this.__state.getValue();

        if (currentState !== ProcessState.New && currentState !== ProcessState.Finalized) {
            throw new IllegalStateException(`Expected New or Finalized state, instead got ${objectKeyByValue(ProcessState, currentState)}`);
        }


        this.__state.set(ProcessState.Initialized);

    }

    finalize() {
        const state = this.__state;

        if (state.getValue() === ProcessState.Running) {
            this.shutdown();
        }

        if (state.getValue() !== ProcessState.Stopped && state.getValue() !== ProcessState.Initialized) {
            throw new IllegalStateException(`Expected Initialized or Stopped state, instead got ${objectKeyByValue(ProcessState, state.getValue())}`);
        }

        state.set(ProcessState.Finalized);
    }

    startup() {
        const currentState = this.__state.getValue();

        if (currentState !== ProcessState.Initialized && currentState !== ProcessState.Stopped) {
            throw new IllegalStateException(`Expected Initial state, instead got ${objectKeyByValue(ProcessState, currentState)}`);
        }

        this.__state.set(ProcessState.Running);
    }

    shutdown() {
        this.__state.set(ProcessState.Stopped);
    }
}
