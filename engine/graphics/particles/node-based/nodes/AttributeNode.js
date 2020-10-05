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
     * @param {LineBuilder} output
     * @param {CodeContext} context
     * @param {string[]} inputs
     * @param {string[]} outputs
     */
    generate_glsl(output, context, inputs, outputs) {

    }

}
