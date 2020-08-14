import { CellFilterUnaryOperation } from "../../../core/CellFilterUnaryOperation.js";
import { assert } from "../../../../../core/assert.js";
import DataType from "../../../../../core/parser/simple/DataType.js";

export class CellFilterNegate extends CellFilterUnaryOperation {
    get dataType() {
        return DataType.Number;
    }

    /**
     *
     * @returns {CellFilterNegate}
     * @param {CellFilter} source
     */
    static from(source) {
        assert.equal(source.isCellFilter, true, 'source.isCellFilter !== true');

        assert.equal(source.dataType, DataType.Number, 'wrong data type');

        const r = new CellFilterNegate();

        r.source = source;

        return r
    }

    operation(v) {
        return -v;
    }
}
