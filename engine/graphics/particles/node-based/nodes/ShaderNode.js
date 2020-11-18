import { ExecutableNode } from "../../../../../../model/game/story/node-graph/ExecutableNode.js";

export class ShaderNode extends ExecutableNode {

    constructor() {
        super();

        /**
         * Whether node writes particle state or not
         * @type {boolean}
         */
        this.writes = false;

        /**
         *
         * @type {FunctionModuleReference[]}
         */
        this.dependencies = [];
    }

    /**
     *
     * @param {FunctionModuleReference} reference
     * @returns {boolean}
     */
    hasModuleDependency(reference) {
        const n = this.dependencies.length;
        for (let i = 0; i < n; i++) {
            const dep = this.dependencies[i];

            if (dep.equals(reference)) {
                return true;
            }
        }

        return false;
    }


    /**
     * @param {FunctionModuleReference} reference
     * @returns {boolean}
     */
    addModuleDependency(reference) {

        if (this.hasModuleDependency(reference)) {
            return false;
        }

        this.dependencies.push(reference);
        return true;
    }

    /**
     *
     * @param {NodeInstance} instance
     * @param {LineBuilder} output
     * @param {CodeContext} context
     * @param {string[]} port_variables
     */
    generate_code(instance, output, context, port_variables) {

    }

}


/**
 * @readonly
 * @type {boolean}
 */
ShaderNode.prototype.isShaderNode = true;

