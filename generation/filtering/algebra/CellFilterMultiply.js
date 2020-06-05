import { CellFilterBinaryOperation } from "../core/CellFilterBinaryOperation.js";
import { assert } from "../../../core/assert.js";

export class CellFilterMultiply extends CellFilterBinaryOperation {
    operation(left, right) {
        return left * right;
    }

    /**
     *
     * @param {CellFilter} left
     * @param {CellFilter} right
     * @returns {CellFilterMultiply}
     */
    static from(left, right) {
        assert.defined(left, 'left');
        assert.defined(right, 'right');

        assert.equal(left.isCellFilter, true, 'left.isCellFilter');
        assert.equal(right.isCellFilter, true, 'right.isCellFilter');

        const r = new CellFilterMultiply();

        r.left = left;
        r.right = right;

        return r;
    }
}
