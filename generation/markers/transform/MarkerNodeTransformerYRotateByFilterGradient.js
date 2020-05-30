import { MarkerNodeTransformer } from "./MarkerNodeTransformer.js";
import Vector3 from "../../../core/geom/Vector3.js";
import { assert } from "../../../core/assert.js";
import { computeCellFilterGradient } from "../../filtering/process/computeCellFilterGradient.js";
import { EPSILON, epsilonEquals } from "../../../core/math/MathUtils.js";

const v3_object = new Vector3();

const v2 = [];

/**
 * Rotate marker on Y axis to align on positive gradient of a cell filter
 * @example A filter that detects mountain tiles can be used to rotate a node to always face towards the nearby mountain tiles
 */
export class MarkerNodeTransformerYRotateByFilterGradient extends MarkerNodeTransformer {

    constructor() {
        super();

        /**
         *
         * @type {CellFilter}
         */
        this.filter = null;

        /**
         * Angular offset in radians
         * @type {number}
         */
        this.offset = 0;
    }

    initialize(seed) {
        if (!this.filter.initialized) {
            this.filter.initialize(seed);
        }
    }

    /**
     *
     * @param {CellFilter} filter
     * @param {number} [offset]
     */
    static from(filter, offset = 0) {

        assert.ok(filter.isCellFilter, 'filter.isCellFilter !== true');
        assert.isNumber(offset, 'offset');

        const r = new MarkerNodeTransformerYRotateByFilterGradient();

        r.filter = filter;
        r.offset = offset;

        return r;
    }

    transform(node, grid) {
        const hasGradient = computeCellFilterGradient(v2, node.position.x, node.position.y, this.filter, grid);

        if (!hasGradient) {
            return node;
        }

        const gradient_x = v2[0];
        const gradient_y = v2[1];

        //compute angle from the gradient
        const gradientAngle = Math.atan2(gradient_y, gradient_x);

        let finalAngle = this.offset + gradientAngle;

        node.transofrm.rotation.toEulerAnglesXYZ(v3_object);

        if (epsilonEquals(v3_object.y, finalAngle, EPSILON)) {
            //special case, already facing in the right direction
            return node;
        }

        const result = node.clone();


        result.transofrm.rotation.__setFromEuler(v3_object.x, finalAngle, v3_object.z, 'YXZ');

        return result;
    }
}
