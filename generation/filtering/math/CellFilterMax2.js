import { CellFilterBinaryOperation } from "../core/CellFilterBinaryOperation.js";
import { max2 } from "../../../core/math/MathUtils.js";
import { assert } from "../../../core/assert.js";

export class CellFilterMax2 extends CellFilterBinaryOperation {

    /**
     *
     * @param {CellFilter} a
     * @param {CellFilter} b
     * @returns {CellFilterMax2}
     */
    static from(a, b) {

        assert.equal(a.isCellFilter, true, 'a.isCellFilter');
        assert.equal(b.isCellFilter, true, 'b.isCellFilter');

        const r = new CellFilterMax2();

        r.left = a;
        r.right = b;

        return r;
    }

    operation(left, right) {
        return max2(left, right);
    }
}
