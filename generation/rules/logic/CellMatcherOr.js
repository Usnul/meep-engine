import { CellMatcherBinary } from "./CellMatcherBinary.js";
import { assert } from "../../../core/assert.js";

export class CellMatcherOr extends CellMatcherBinary {
    match(data, x, y,rotation) {
        return this.left.match(data, x, y, rotation)
            || this.right.match(data, x, y,rotation);
    }

    /**
     *
     * @param {CellMatcher} left
     * @param {CellMatcher} right
     * @returns {CellMatcherOr}
     */
    static from(left, right) {
        assert.defined(left,'left');
        assert.defined(right,'right');

        assert.equal(left.isCellMatcher, true,'left.isGridCellRule');
        assert.equal(right.isCellMatcher, true,'right.isGridCellRule');

        const r = new CellMatcherOr();

        r.left = left;
        r.right = right;

        return r;
    }
}
