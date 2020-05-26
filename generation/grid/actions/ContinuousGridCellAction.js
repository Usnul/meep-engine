export class ContinuousGridCellAction {
    constructor() {

        /**
         *
         * @type {boolean}
         * @private
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
     * @param {number} seed
     * @param {EntityComponentDataset} ecd
     * @param {GridData} grid
     */
    initialize(seed, ecd, grid) {
        this.__initialized = true;
    }

    finalize() {
        this.__initialized = false;
    }

    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {GridData} grid
     * @param {number} x
     * @param {number} y
     * @param {number} rotation
     * @param {CellFilter} strength
     */
    execute(ecd, grid, x, y, rotation, strength) {

    }
}


/**
 * @readonly
 * @type {boolean}
 */
ContinuousGridCellAction.prototype.isContinuousGridCellAction = true;
