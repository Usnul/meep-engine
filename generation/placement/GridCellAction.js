import { assert } from "../../core/assert.js";

export class GridCellAction {
    /**
     *
     * @param {GridData} data
     * @param {number} x
     * @param {number} y
     * @param {number} rotation
     */
    execute(data, x, y, rotation) {

    }

    /**
     *
     * @param {GridData} data
     * @param {number} seed
     */
    initialize(data, seed) {

        assert.equal(data.isGridData, true, 'data.isGridData !== true');
        assert.isNumber(seed, 'seed');

    }
}

/**
 * @readonly
 * @type {boolean}
 */
GridCellAction.prototype.isGridCellAction = true;
