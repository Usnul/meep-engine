import { CellFilterBinaryOperation } from "../CellFilterBinaryOperation.js";
import { assert } from "../../../core/assert.js";

export class CellFilterDivide extends CellFilterBinaryOperation {
    operation(left, right) {
        return left / right;
    }

    /**
     *
     * @param {CellFilter} left
     * @param {CellFilter} right
     * @returns {CellFilterDivide}
     */
    static from(left, right) {
        assert.defined(left, 'left');
        assert.defined(right, 'right');

        assert.equal(left.isCellFilter, true, 'left.isCellFilter');
        assert.equal(right.isCellFilter, true, 'right.isCellFilter');

        const r = new CellFilterDivide();

        r.left = left;
        r.right = right;

        return r;
    }

}