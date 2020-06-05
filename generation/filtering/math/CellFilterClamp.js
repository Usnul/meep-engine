import { CellFilterOperationTertiary } from "../core/CellFilterOperationTertiary.js";
import { clamp } from "../../../core/math/MathUtils.js";
import { assert } from "../../../core/assert.js";

export class CellFilterClamp extends CellFilterOperationTertiary {
    operation(a, b, c) {
        return clamp(a, b, c);
    }

    /**
     *
     * @param {CellFilter} value
     * @param {CellFilter} min
     * @param {CellFilter} max
     * @returns {CellFilterClamp}
     */
    static from(value, min, max) {
        assert.equal(value.isCellFilter, true, "value.isCellFilter !== true");

        assert.equal(min.isCellFilter, true, "min.isCellFilter !== true");
        assert.equal(max.isCellFilter, true, "max.isCellFilter !== true");

        const r = new CellFilterClamp();

        r.a = value;
        r.b = min;
        r.c = max;

        return r;
    }
}
