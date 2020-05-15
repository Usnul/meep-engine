import { CellFilterOperationTertiary } from "./CellFilterOperationTertiary.js";
import { lerp } from "../../core/math/MathUtils.js";
import { assert } from "../../core/assert.js";

export class CellFilterLerp extends CellFilterOperationTertiary {
    operation(a, b, c) {
        return lerp(a, b, c);
    }

    /**
     *
     * @param {CellFilter} a
     * @param {CellFilter} b
     * @param {CellFilter} f
     * @returns {CellFilterLerp}
     */
    static from(a, b, f) {

        assert.defined(a, 'a');
        assert.equal(a.isCellFilter, true, 'a.isCellFilter');

        assert.defined(b, 'b');
        assert.equal(b.isCellFilter, true, 'b.isCellFilter');

        assert.defined(f, 'f');
        assert.equal(f.isCellFilter, true, 'f.isCellFilter');

        const r = new CellFilterLerp();

        r.a = a;
        r.b = b;
        r.c = f;

        return r;
    }
}
