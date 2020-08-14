import { CellFilterOperationTertiary } from "../../core/CellFilterOperationTertiary.js";
import { smoothStep } from "../../../../core/math/MathUtils.js";
import { assert } from "../../../../core/assert.js";

/**
 * Adapted from OpenGL spec
 * smoothstep performs smooth Hermite interpolation between 0 and 1 when edge0 < x < edge1. This is useful in cases where a threshold function with a smooth transition is desired.
 */
export class CellFilterSmoothStep extends CellFilterOperationTertiary {
    operation(edge0, edge1, x) {
        return smoothStep(edge0, edge1, x);
    }

    /**
     *
     * @param {CellFilter} edge0 Specifies the value of the lower edge of the Hermite function.
     * @param {CellFilter} edge1 Specifies the value of the upper edge of the Hermite function.
     * @param {CellFilter} x Specifies the source value for interpolation.
     * @returns {CellFilterSmoothStep}
     */
    static from(edge0, edge1, x) {
        assert.equal(edge0.isCellFilter, true, 'edge0.isCellFilter !== true');
        assert.equal(edge1.isCellFilter, true, 'edge1.isCellFilter !== true');
        assert.equal(x.isCellFilter, true, 'x.isCellFilter !== true');

        const r = new CellFilterSmoothStep();

        r.a = edge0;
        r.b = edge1;
        r.c = x;

        return r;
    }
}
