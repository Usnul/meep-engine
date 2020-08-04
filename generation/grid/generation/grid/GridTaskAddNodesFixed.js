import { GridTaskGenerator } from "../../GridTaskGenerator.js";
import { actionTask } from "../../../../core/process/task/TaskUtils.js";
import { MarkerNodeConsumerBuffer } from "../../../markers/emitter/MarkerNodeConsumerBuffer.js";
import { assert } from "../../../../core/assert.js";

export class GridTaskAddNodesFixed extends GridTaskGenerator {
    constructor() {
        super();

        /**
         *
         * @type {MarkerNodeEmitter}
         */
        this.nodes = null;
    }

    /**
     *
     * @param {MarkerNodeEmitter} nodes
     * @return {GridTaskAddNodesFixed}
     */
    static from(nodes) {
        assert.equal(nodes.isMarkerNodeEmitter, true, 'nodes.isMarkerNodeEmitter !== true');

        const r = new GridTaskAddNodesFixed();

        r.nodes = nodes;

        return r;
    }

    build(grid, ecd, seed) {
        return actionTask(() => {
            this.nodes.initialize(grid, seed);

            const buffer = new MarkerNodeConsumerBuffer();
            this.nodes.execute(grid, 0, 0, 0, buffer);

            buffer.writeToGrid(grid);
        });
    }
}
