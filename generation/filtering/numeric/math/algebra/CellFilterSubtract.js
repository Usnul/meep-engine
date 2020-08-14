import { CellFilterBinaryOperation } from "../../../core/CellFilterBinaryOperation.js";
import { assert } from "../../../../../core/assert.js";
import DataType from "../../../../../core/parser/simple/DataType.js";

export class CellFilterSubtract extends CellFilterBinaryOperation {
    get dataType() {
        return DataType.Number;
    }

    operation(left, right) {
        return left - right;
    }

    /**
     *
     * @param {CellFilter} left
     * @param {CellFilter} right
     * @returns {CellFilterSubtract}
     */
    static from(left, right) {
        assert.defined(left, 'left');
        assert.defined(right, 'right');

        assert.equal(left.isCellFilter, true, 'left.isCellFilter');
        assert.equal(right.isCellFilter, true, 'right.isCellFilter');

        assert.equal(left.dataType, DataType.Number, 'wrong data type');
        assert.equal(right.dataType, DataType.Number, 'wrong data type');

        const r = new CellFilterSubtract();

        r.left = left;
        r.right = right;

        return r;
    }
}
