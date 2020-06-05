import { assert } from "../../core/assert.js";

export class CellFilter {

    constructor() {
        /**
         *
         * @type {boolean}
         * @protected
         */
        this.__initialized = false;
    }

    /**
     *
     * @returns {boolean}
     */
    get initialized() {
        return this.__initialized;
    }

    /**
     *
     * @param {GridData} grid
     * @param {number} seed
     */
    initialize(grid, seed) {
        assert.equal(grid.isGridData, true, 'grid.isGridData !== true');
        assert.isNumber(seed, 'seed');

        this.__initialized = true;
    }

    finalize() {
        this.__initialized = false;
    }

    /**
     *
     * @param {GridData} grid
     * @param {number} x Grid coordinate X
     * @param {number} y Grid coordinate Y
     * @param {number} rotation
     * @returns {number}
     */
    execute(grid, x, y, rotation) {
        throw new Error('Must be overridden in the subclass');
    }
}


/**
 * @readonly
 * @type {boolean}
 */
CellFilter.prototype.isCellFilter = true;
