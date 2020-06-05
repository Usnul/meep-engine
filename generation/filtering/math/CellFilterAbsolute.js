import { CellFilterUnaryOperation } from "../core/CellFilterUnaryOperation.js";
import { assert } from "../../../core/assert.js";

/**
 * Compute absolute value (see Math.abs)
 */
export class CellFilterAbsolute extends CellFilterUnaryOperation {

    /**
     *
     * @param {CellFilter} source
     * @returns {CellFilterAbsolute}
     */
    static from(source) {
        assert.equal(source.isCellFilter, true, 'source.isCellFilter !== true');

        const r = new CellFilterAbsolute();

        r.source = source;

        return r;
    }

    operation(v) {
        return Math.abs(v);
    }
}
