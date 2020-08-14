import { CellFilterOperationTertiary } from "../../core/CellFilterOperationTertiary.js";
import { inverseLerp } from "../../../../core/math/MathUtils.js";
import { assert } from "../../../../core/assert.js";

export class CellFilterInverseLerp extends CellFilterOperationTertiary {

    /**
     *
     * @param {CellFilter} a
     * @param {CellFilter} b
     * @param {CellFilter} f Interpolation factor, expected value between 0 and 1, 0 would lead to filter A being used, and 1 to filter B being used, values between 0 and 1 produce a proportional mix
     * @returns {CellFilterInverseLerp}
     */
    static from(a, b, f) {

        assert.defined(a, 'a');
        assert.equal(a.isCellFilter, true, 'a.isCellFilter');

        assert.defined(b, 'b');
        assert.equal(b.isCellFilter, true, 'b.isCellFilter');

        assert.defined(f, 'f');
        assert.equal(f.isCellFilter, true, 'f.isCellFilter');

        const r = new CellFilterInverseLerp();

        r.a = a;
        r.b = b;
        r.c = f;

        return r;
    }

    operation(a, b, value) {
        return inverseLerp(a, b, value);
    }
}
