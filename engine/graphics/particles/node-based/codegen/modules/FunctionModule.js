import { FunctionSignature } from "./FunctionSignature.js";
import { assert } from "../../../../../../core/assert.js";
import LineBuilder from "../../../../../../core/codegen/LineBuilder.js";

export class FunctionModule {
    constructor() {
        /**
         *
         * @type {string}
         */
        this.id = '';

        /**
         *
         * @type {FunctionSignature}
         */
        this.signature = new FunctionSignature();

        /**
         *
         * @type {FunctionModuleReference[]}
         */
        this.dependencies = [];

        /**
         * These variables must be present in the program context
         * @type {ParticleAttributeSpecification[]}
         */
        this.read_variables = [];

        /**
         *
         * @type {LineBuilder}
         */
        this.code_lines = new LineBuilder();
    }

    /**
     *
     * @param {string} id
     * @param {FunctionSignature} signature
     * @param {FunctionModuleReference} [dependencies]
     * @param {ParticleAttributeSpecification[]} [read_variables]
     * @param {LineBuilder} code_lines
     * @returns {FunctionModule}
     */
    static from({ id, signature, dependencies = [], read_variables = [], code_lines }) {
        assert.typeOf(id, 'string', 'id');

        const r = new FunctionModule();

        r.id = id;
        r.signature = signature;
        r.dependencies = dependencies;
        r.read_variables = read_variables;
        r.code_lines = code_lines;

        return r;
    }

    /**
     *
     * @param {FunctionModuleReference} reference
     * @returns {boolean}
     */
    dependencyExists(reference) {
        assert.defined(reference, 'reference');
        assert.equal(reference.isFunctionModuleReference, true, 'signature.isFunctionModuleReference !== true');

        const dependencies = this.dependencies;
        const n = dependencies.length;
        for (let i = 0; i < n; i++) {
            const dependency = dependencies[i];

            if (dependency.equals(reference)) {
                return true;
            }
        }

        // not found
        return false;
    }

    /**
     *
     * @param {string} id
     * @param {FunctionSignature} signature
     * @returns {boolean}
     */
    addDependency(id, signature) {

        assert.typeOf(id, 'string', 'id');
        assert.defined(signature, 'signature');
        assert.equal(signature.isFunctionSignature, true, 'signature.isFunctionSignature !== true');

        const s = new FunctionModuleReference();

        s.signature = signature;
        s.id = id;

        if (this.dependencyExists(s)) {
            return false;
        }

        this.dependencies.push(s);

        return true;
    }

    /**
     * Produce code for the function
     * @param {LineBuilder} output
     */
    generate(output) {

        output.addLines(this.code_lines);

    }
}

/**
 * @readonly
 * @type {boolean}
 */
FunctionModule.prototype.isFunctionModule = true;
