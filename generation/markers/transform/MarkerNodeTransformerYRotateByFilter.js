import { MarkerNodeTransformer } from "./MarkerNodeTransformer.js";
import { assert } from "../../../core/assert.js";
import { EPSILON, epsilonEquals } from "../../../core/math/MathUtils.js";
import Vector3 from "../../../core/geom/Vector3.js";

const v3_object = new Vector3();

export class MarkerNodeTransformerYRotateByFilter extends MarkerNodeTransformer {

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

        const r = new MarkerNodeTransformerYRotateByFilter();

        r.filter = filter;
        r.offset = offset;

        return r;
    }

    transform(node, grid) {

        const angle_factor = this.filter.execute(grid, node.position.x, node.position.y, 0);

        let finalAngle = this.offset + angle_factor * Math.PI * 2;

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
