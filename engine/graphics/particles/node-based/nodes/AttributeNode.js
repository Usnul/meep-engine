import { ExecutableNode } from "../../../../../../model/game/story/node-graph/ExecutableNode.js";

export class AttributeNode extends ExecutableNode {

    constructor() {
        super();

        /**
         * Whether node writes particle state or not
         * @type {boolean}
         */
        this.writes = false;
    }

    /**
     *
     * @param {NodeInstance} instance
     * @param {LineBuilder} output
     * @param {CodeContext} context
     * @param {string[]} port_variables
     */
    generate_glsl(instance, output, context, port_variables) {

    }

}
