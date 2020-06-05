import { CellFilterUnaryOperation } from "../core/CellFilterUnaryOperation.js";
import { assert } from "../../../core/assert.js";

export class CellFilterOneMinus extends CellFilterUnaryOperation {

    /**
     *
     * @returns {CellFilterOneMinus}
     * @param {CellFilter} source
     */
    static from(source) {
        assert.equal(source.isCellFilter, true, 'source.isCellFilter !== true');

        const r = new CellFilterOneMinus();

        r.source = source;

        return r
    }

    operation(v) {
        return 1 - v;
    }
}
