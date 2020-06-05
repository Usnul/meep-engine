export class CellMatcher {

    /**
     *
     * @param {GridData} grid
     * @param {number} seed
     */
    initialize(grid, seed) {

    }

    /**
     *
     * @returns {boolean}
     * @param {GridData} grid
     * @param {number} x
     * @param {number} y
     * @param {number} rotation
     */
    match(grid, x, y, rotation) {
        return true;
    }
}

/**
 * @readonly
 * @type {boolean}
 */
CellMatcher.prototype.isCellMatcher = true;
