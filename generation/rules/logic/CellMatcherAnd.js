import { CellMatcherBinary } from "./CellMatcherBinary.js";
import { assert } from "../../../core/assert.js";

export class CellMatcherAnd extends CellMatcherBinary {

    match(grid, x, y, rotation) {
        return this.left.match(grid, x, y, rotation)
            && this.right.match(grid, x, y, rotation);
    }

    /**
     *
     * @param {CellMatcher} left
     * @param {CellMatcher} right
     * @returns {CellMatcherAnd}
     */
    static from(left, right) {
        assert.defined(left, 'left');
        assert.defined(right, 'right');

        assert.equal(left.isCellMatcher, true, 'left.isGridCellRule');
        assert.equal(right.isCellMatcher, true, 'right.isGridCellRule');

        const r = new CellMatcherAnd();

        r.left = left;
        r.right = right;

        return r;
    }
}
