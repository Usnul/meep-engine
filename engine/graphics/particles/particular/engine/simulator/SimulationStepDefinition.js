import { SimulationStepType } from "./SimulationStepType.js";
import { objectKeyByValue } from "../../../../../../core/model/ObjectUtils.js";

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

    toJSON() {
        return {
            type: objectKeyByValue(SimulationStepType, this.type),
            parameters: this.parameters
        }
    }

    fromJSON({ type, parameters = [] }) {
        this.type = SimulationStepType[type];
        this.parameters = parameters;
    }
}
