import { CellFilterBinaryOperation } from "../../core/CellFilterBinaryOperation.js";
import DataType from "../../../../core/parser/simple/DataType.js";
import { assert } from "../../../../core/assert.js";

export class CellFilterAnd extends CellFilterBinaryOperation {
    get dataType() {
        return DataType.Boolean;
    }

    /**
     *
     * @param {CellFilter} left
     * @param {CellFilter} right
     */
    static from(left, right) {
        assert.equal(left.isCellFilter, true, 'left.isCellFilter !== true');
        assert.equal(right.isCellFilter, true, 'right.isCellFilter !== true');

        assert.equal(left.dataType, DataType.Boolean, 'wrong data type');
        assert.equal(right.dataType, DataType.Boolean, 'wrong data type');

        const r = new CellFilterAnd();

        r.left = left;
        r.right = right;

        return r;
    }

    operation(left, right) {
        return left && right;
    }
}
