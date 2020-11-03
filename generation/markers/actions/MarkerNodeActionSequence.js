import { MarkerNodeAction } from "./MarkerNodeAction.js";
import { assert } from "../../../core/assert.js";

export class MarkerNodeActionSequence extends MarkerNodeAction {
    constructor() {
        super();

        /**
         *
         * @type {MarkerNodeAction[]}
         */
        this.elements = [];
    }

    /**
     *
     * @returns {MarkerNodeActionSequence}
     * @param {MarkerNodeAction[]} elements
     */
    static from(elements) {
        const r = new MarkerNodeActionSequence();

        r.elements = elements;

        return r;
    }

    initialize(grid, ecd, seed) {
        const actions = this.elements;
        const n = actions.length;

        for (let i = 0; i < n; i++) {
            const action = actions[i];

            action.initialize(grid, ecd, seed + i);
        }
    }

    execute(grid, ecd, node) {

        assert.defined(grid, 'grid');
        assert.equal(grid.isGridData, true, 'grid.isGridData !== true');


        assert.defined(ecd, 'ecd');
        assert.equal(ecd.isEntityComponentDataset, true, 'ecd.isEntityComponentDataset !== true');

        assert.defined(node, 'node');
        assert.equal(node.isMarkerNode, true, 'node.isMarkerNode !== true');

        const actions = this.elements;
        const n = actions.length;

        for (let i = 0; i < n; i++) {
            const action = actions[i];

            action.execute(grid, ecd, node);
        }

    }
}
