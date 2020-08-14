import { CellFilter } from "../../CellFilter.js";
import { assert } from "../../../../core/assert.js";

/**
 * Sobel edge-detection filter
 */
export class CellFilterSobel extends CellFilter {
    constructor() {
        super();

        /**
         *
         * @type {CellFilter}
         */
        this.source = null;
    }

    initialize(grid, seed) {
        super.initialize(grid, seed);

        if (!this.source.initialized) {
            this.source.initialize(grid, seed);
        }
    }


    /**
     *
     * @param {CellFilter} source
     * @returns {CellFilterSobel}
     */
    static from(source) {
        assert.equal(source.isCellFilter, true, 'source.isCellFilter !== true');

        const r = new CellFilterSobel();

        r.source = source;

        return r;
    }

    execute(grid, x, y, rotation) {
        const filter = this.source;

        //read surrounding points
        const topLeft = filter.execute(grid, x - 1, y - 1, 0);
        const top = filter.execute(grid, x, y - 1, 0);
        const topRight = filter.execute(grid, x + 1, y - 1, 0);

        const left = filter.execute(grid, x - 1, y, 0);
        const right = filter.execute(grid, x + 1, y, 0);

        const bottomLeft = filter.execute(grid, x - 1, y + 1, 0);
        const bottom = filter.execute(grid, x, y + 1, 0);
        const bottomRight = filter.execute(grid, x + 1, y + 1, 0);

        // compute gradients
        const dX = (topRight + 2.0 * right + bottomRight) - (topLeft + 2.0 * left + bottomLeft);
        const dY = (bottomLeft + 2.0 * bottom + bottomRight) - (topLeft + 2.0 * top + topRight);

        //normalize vector
        const magnitude = Math.sqrt(dX * dX + dY * dY);

        return magnitude;
    }
}
