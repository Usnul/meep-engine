import { SimulationStepType } from "./SimulationStepType.js";

export class SimulationStepDefinition {
    constructor() {
        /**
         *
         * @type {SimulationStepType|number}
         */
        this.type = SimulationStepType.Unknown;
        /**
         *
         * @type {number[]}
         */
        this.parameters = [];
    }

    /**
     *
     * @param {SimulationStepType} type
     * @param {number[]} parameters
     * @return {SimulationStepDefinition}
     */
    static from(type, parameters) {
        const r = new SimulationStepDefinition();

        r.type = type;
        r.parameters = parameters;

        return r;
    }
}
