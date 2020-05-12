import { GirdCellMatcherBinary } from "./GirdCellMatcherBinary.js";
import { assert } from "../../../core/assert.js";

export class GridCellMatcherAnd extends GirdCellMatcherBinary {

    /**
     *
     * @param {AbstractGridCellMatcher} left
     * @param {AbstractGridCellMatcher} right
     * @returns {GridCellMatcherAnd}
     */
    static from(left, right) {
        assert.defined(left, 'left');
        assert.defined(right, 'right');

        const r = new GridCellMatcherAnd();

        r.left = left;
        r.right = right;

        return r;
    }

    match(grid, x, y, rotation) {
        return this.left.match(grid, x, y, rotation) && this.right.match(grid, x, y, rotation);
    }
}
