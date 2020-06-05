import { CellFilterUnaryOperation } from "../../core/CellFilterUnaryOperation.js";
import { assert } from "../../../../core/assert.js";

export class CellFilterNegate extends CellFilterUnaryOperation {
    /**
     *
     * @returns {CellFilterNegate}
     * @param {CellFilter} source
     */
    static from(source) {
        assert.equal(source.isCellFilter, true, 'source.isCellFilter !== true');

        const r = new CellFilterNegate();

        r.source = source;

        return r
    }

    operation(v) {
        return -v;
    }
}
