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
     * @param {number} seed
     */
    initialize(seed) {
        this.__initialized = true;
    }

    finalize() {
        this.__initialized = false;
    }

    /**
     *
     * @param {GridData} grid
     * @param {number} x
     * @param {number} y
     * @param {number} rotation
     * @returns {number}
     */
    execute(grid, x, y, rotation) {

    }
}


/**
 * @readonly
 * @type {boolean}
 */
CellFilter.prototype.isCellFilter = true;
