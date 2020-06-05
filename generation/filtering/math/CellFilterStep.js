import { assert } from "../../../core/assert.js";
import { CellFilterBinaryOperation } from "../core/CellFilterBinaryOperation.js";

/**
 * The step function returns 0.0 if x is smaller than edge and otherwise 1.0.
 */
export class CellFilterStep extends CellFilterBinaryOperation {
    operation(edge, x) {
        if (x < edge) {
            return 0;
        } else {
            return 1;
        }
    }

    /**
     *
     * @param {CellFilter} edge
     * @param {CellFilter} x
     * @returns {CellFilterStep}
     */
    static from(edge, x) {

        assert.defined(edge, 'edge');
        assert.equal(edge.isCellFilter, true, 'edge.isCellFilter');

        assert.defined(x, 'x');
        assert.equal(x.isCellFilter, true, 'x.isCellFilter');

        const r = new CellFilterStep();

        r.left = edge;
        r.right = x;

        return r;
    }
}
