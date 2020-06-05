import { assert } from "../../../core/assert.js";

export class CellProcessingRule {
    constructor() {

        /**
         *
         * @type {CellFilter}
         */
        this.filter = null;

        /**
         *
         * @type {ContinuousGridCellAction}
         */
        this.action = null;

    }

    /**
     *
     * @param {CellFilter} filter
     * @param {ContinuousGridCellAction}action
     */
    static from(filter, action) {
        assert.ok(filter.isCellFilter, 'filter.isCellFilter');
        assert.ok(action.isContinuousGridCellAction, 'action.isContinuousGridCellAction');

        const r = new CellProcessingRule();

        r.filter = filter;
        r.action = action;

        return r;
    }

    /**
     *
     * @param {number} seed
     * @param {EntityComponentDataset} ecd
     * @param {GridData} grid
     */
    initialize(seed, ecd, grid) {
        if (!this.action.initialized) {
            this.action.initialize(seed, ecd, grid);
        }

        if (!this.filter.initialized) {
            this.filter.initialize(grid, seed);
        }
    }
}
