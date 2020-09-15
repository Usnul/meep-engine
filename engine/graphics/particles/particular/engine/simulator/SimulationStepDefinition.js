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
         * @type {Object}
         */
        this.parameters = {};
    }

    static from(type, parameters) {
        const r = new SimulationStepDefinition();

        r.type = type;
        r.parameters = parameters;

        return r;
    }
}
