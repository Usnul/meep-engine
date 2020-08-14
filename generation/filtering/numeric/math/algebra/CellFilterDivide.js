import { CellFilterBinaryOperation } from "../../../core/CellFilterBinaryOperation.js";
import { assert } from "../../../../../core/assert.js";
import DataType from "../../../../../core/parser/simple/DataType.js";

export class CellFilterDivide extends CellFilterBinaryOperation {
    get dataType() {
        return DataType.Number;
    }

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

        assert.equal(left.dataType, DataType.Number, 'wrong data type');
        assert.equal(right.dataType, DataType.Number, 'wrong data type');

        const r = new CellFilterDivide();

        r.left = left;
        r.right = right;

        return r;
    }

}
