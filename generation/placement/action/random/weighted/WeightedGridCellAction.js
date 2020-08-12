import { assert } from "../../../../../core/assert.js";

export class WeightedGridCellAction {

    constructor() {

        /**
         *
         * @type {GridCellAction}
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
     * @param {GridCellAction} action
     * @param {CellFilter} weight
     */
    static from(action, weight) {
        assert.equal(action.isGridCellAction, true, 'action.isGridCellAction !== true');
        assert.equal(weight.isCellFilter, true, 'weight.isCellFilter !== true');

        const r = new WeightedGridCellAction();

        r.action = action;
        r.weight = weight;

        return r;
    }

    /**
     * @param {GridData} grid
     * @param {number} seed
     */
    initialize(grid, seed) {
        this.action.initialize(grid, seed);

        if (!this.weight.initialized) {
            this.weight.initialize(grid, seed);
        }
    }
}

/**
 * @readonly
 * @type {boolean}
 */
WeightedGridCellAction.prototype.isWeightedGridCellAction = true;
