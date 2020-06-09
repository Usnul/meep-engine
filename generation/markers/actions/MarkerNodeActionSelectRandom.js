import { MarkerNodeAction } from "./MarkerNodeAction.js";
import { assert } from "../../../core/assert.js";
import { randomFromArray, seededRandom } from "../../../core/math/MathUtils.js";

export class MarkerNodeActionSelectRandom extends MarkerNodeAction {
    constructor() {
        super();


        /**
         *
         * @type {MarkerNodeAction[]}
         */
        this.elements = [];

        this.__random = seededRandom(0);
    }

    /**
     *
     * @param {MarkerNodeAction[]} elements
     * @returns {MarkerNodeActionSelectRandom}
     */
    static from(elements){
        const r = new MarkerNodeActionSelectRandom();

        r.elements = elements;

        return r
    }

    initialize(grid, seed) {
        const actions = this.elements;
        const n = actions.length;

        assert.greaterThan(n, 0, `Number of option elements must be greater than 0`);

        for (let i = 0; i < n; i++) {
            const action = actions[i];

            action.initialize(grid, seed);
        }

        this.__random.setCurrentSeed(seed);
    }

    execute(grid, ecd, node) {

        assert.defined(grid, 'grid');
        assert.equal(grid.isGridData, true, 'grid.isGridData !== true');


        assert.defined(ecd, 'ecd');
        assert.equal(ecd.isEntityComponentDataset, true, 'ecd.isEntityComponentDataset !== true');

        assert.defined(node, 'node');
        assert.equal(node.isMarkerNode, true, 'node.isMarkerNode !== true');

        const action = randomFromArray(this.elements, this.__random);

        action.execute(grid, ecd, node);

    }
}
