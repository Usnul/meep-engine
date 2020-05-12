import { assert } from "../../../core/assert.js";
import { GirdCellMatcherBinary } from "./GirdCellMatcherBinary.js";

export class GridCellMatcherOr extends GirdCellMatcherBinary {
    /**
     *
     * @param {AbstractGridCellMatcher} left
     * @param {AbstractGridCellMatcher} right
     * @returns {GridCellMatcherOr}
     */
    static from(left, right) {
        assert.defined(left, 'left');
        assert.defined(right, 'right');

        const r = new GridCellMatcherOr();

        r.left = left;
        r.right = right;

        return r;
    }

    match(grid, x, y, rotation) {
        return this.left.match(grid, x, y, rotation) || this.right.match(grid, x, y, rotation);
    }
}
