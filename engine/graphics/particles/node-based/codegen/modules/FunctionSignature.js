import { isArrayEqual } from "../../../../../../core/collection/ArrayUtils.js";
import { assert } from "../../../../../../core/assert.js";

export class FunctionSignature {
    constructor() {
        /**
         *
         * @type {FunctionParameterSpecification[]}
         */
        this.parameters = [];

        /**
         *
         * @type {DataType}
         */
        this.return_type = null;
    }

    /**
     *
     * @param {FunctionSignature} parameters
     * @param {DataType} return_type
     * @returns {FunctionSignature}
     */
    static from(parameters, return_type) {
        assert.isArray(parameters, 'parameters');
        assert.defined(return_type, 'return_type');


        const r = new FunctionSignature();

        r.parameters = parameters;
        r.return_type = return_type;

        return r;
    }

    /**
     *
     * @param {FunctionSignature} other
     * @returns {boolean}
     */
    equals(other) {
        return this.return_type.equals(other.return_type) && isArrayEqual(this.parameters, other.parameters);
    }

    toString() {
        return `FunctionParameterSignature{ parameters:[${this.parameters.map(p => p.toString()).join(', ')}], return_type:${this.return_type} }`;
    }
}


/**
 * @readonly
 * @type {boolean}
 */
FunctionSignature.prototype.isFunctionSignature = true;
