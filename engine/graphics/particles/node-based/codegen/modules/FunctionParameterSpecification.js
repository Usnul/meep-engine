import { PortDirection } from "../../../../../../core/model/node-graph/node/PortDirection.js";
import { objectKeyByValue } from "../../../../../../core/model/ObjectUtils.js";

export class FunctionParameterSpecification {
    constructor() {

        /**
         *
         * @type {PortDirection|number}
         */
        this.direction = PortDirection.In;


        /**
         * @type {DataType}
         */
        this.type = null;
    }

    /**
     *
     * @param {PortDirection} direction
     * @param {DataType} type
     *
     * @returns {FunctionParameterSpecification}
     */
    static from( direction, type) {
        const r = new FunctionParameterSpecification();


        r.direction = direction;
        r.type = type;

        return r;
    }

    /**
     *
     * @param {FunctionParameterSpecification} other
     * @returns {boolean}
     */
    equals(other) {

        if (this.direction !== other.direction) {
            return false;
        }

        if (!this.type.equals(other.type)) {
            return false;
        }

        // all is equal
        return true;
    }

    toString() {
        return `FunctionParameterSpecification{ direction:${objectKeyByValue(PortDirection, this.direction)}, type:${this.type} }`;
    }
}
