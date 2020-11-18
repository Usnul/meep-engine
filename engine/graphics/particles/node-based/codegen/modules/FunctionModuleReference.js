import { assert } from "../../../../../../core/assert.js";

export class FunctionModuleReference {
    constructor() {

        /**
         *
         * @type {string}
         */
        this.id = "";

        /**
         *
         * @type {FunctionSignature}
         */
        this.signature = null;

    }

    /**
     *
     * @param {string} id
     * @param {FunctionSignature} signature
     * @returns {FunctionModuleReference}
     */
    static from(id, signature) {
        assert.defined(id, 'id');
        assert.typeOf(id, 'string', 'id');

        assert.defined(signature, 'signature');
        assert.equal(signature.isFunctionSignature, true, 'signature.isFunctionSignature !== true');

        const r = new FunctionModuleReference();

        r.id = id;
        r.signature = signature;

        return r;
    }

    /**
     *
     * @param {FunctionModuleReference} other
     * @returns {boolean}
     */
    equals(other) {
        if (this.id !== other.id) {
            return false;
        }

        return this.signature.equals(other.signature);
    }

    toString() {
        return `FunctionModuleReference{id:${this.id}, signature:${this.signature}}`;
    }
}


/**
 * @readonly
 * @type {boolean}
 */
FunctionModuleReference.prototype.isFunctionModuleReference = true;
