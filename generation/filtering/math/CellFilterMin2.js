import { CellFilterBinaryOperation } from "../core/CellFilterBinaryOperation.js";
import { min2 } from "../../../core/math/MathUtils.js";
import { assert } from "../../../core/assert.js";

export class CellFilterMin2 extends CellFilterBinaryOperation {

    /**
     *
     * @param {CellFilter} a
     * @param {CellFilter} b
     * @returns {CellFilterMin2}
     */
    static from(a, b) {

        assert.equal(a.isCellFilter, true, 'a.isCellFilter');
        assert.equal(b.isCellFilter, true, 'b.isCellFilter');

        const r = new CellFilterMin2();

        r.left = a;
        r.right = b;

        return r;
    }

    operation(left, right) {
        return min2(left, right);
    }
}
