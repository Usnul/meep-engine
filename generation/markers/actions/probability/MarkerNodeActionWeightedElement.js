import { assert } from "../../../../core/assert.js";

export class MarkerNodeActionWeightedElement {
    constructor() {
        /**
         *
         * @type {MarkerNodeAction}
         */
        this.action = null;

        /**
         *
         * @type {CellFilter}
         */
        this.weight = null;
    }

    /**
     *
     * @param {GridData} grid
     * @param {EntityComponentDataset} ecd
     * @param {number} seed
     */
    initialize(grid, ecd, seed) {

        this.action.initialize(grid, ecd, seed);

        if (!this.weight.initialized) {
            this.weight.initialize(grid, seed);
        }
    }

    /**
     *
     * @param {MarkerNodeAction} action
     * @param {CellFilter} weight
     * @returns {MarkerNodeActionWeightedElement}
     */
    static from(action, weight) {
        assert.equal(action.isMarkerNodeAction, true, 'action.isMarkerNodeAction !== true');
        assert.equal(weight.isCellFilter, true, 'weight.isCellFilter !== true');

        const r = new MarkerNodeActionWeightedElement();

        r.action = action;
        r.weight = weight;

        return r;
    }
}
