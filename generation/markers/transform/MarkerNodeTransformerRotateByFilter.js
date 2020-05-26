import { MarkerNodeTransformer } from "./MarkerNodeTransformer.js";
import Vector3 from "../../../core/geom/Vector3.js";
import { assert } from "../../../core/assert.js";
import { computeCellFilterGradient } from "../../filtering/process/computeCellFilterGradient.js";

const v3_object = new Vector3();

const v2 = [];

/**
 * Rotate marker on Y axis to align on positive gradient of a cell filter
 * @example A filter that detects mountain tiles can be used to rotate a node to always face towards the nearby mountain tiles
 */
export class MarkerNodeTransformerRotateByFilter extends MarkerNodeTransformer {

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
        this.filter.initialize(seed);
    }

    /**
     *
     * @param {CellFilter} filter
     * @param {number} [offset]
     */
    static from(filter, offset = 0) {

        assert.ok(filter.isCellFilter, 'filter.isCellFilter !== true');
        assert.isNumber(offset, 'offset');

        const r = new MarkerNodeTransformerRotateByFilter();

        r.filter = filter;
        r.offset = offset;

        return r;
    }

    transform(node, grid) {
        computeCellFilterGradient(v2, node.position.x, node.position.y, this.filter, grid);

        //compute angle from the gradient

        const gradient_x = v2[0];
        const gradient_y = v2[1];

        const gradientAngle = Math.atan2(gradient_y, gradient_x);

        const finalAngle = this.offset + gradientAngle;

        const result = node.clone();

        result.transofrm.rotation.toEulerAnglesXYZ(v3_object);

        result.transofrm.rotation.__setFromEuler(v3_object.x, finalAngle, v3_object.z);

        return result;
    }
}
