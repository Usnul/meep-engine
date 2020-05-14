import { assert } from "../../../../core/assert.js";

export class RoadConnection {
    constructor() {

        /**
         *
         * @type {PathEndPoint}
         */
        this.source = null;
        /**
         *
         * @type {PathEndPoint}
         */
        this.target = null;

        /**
         *
         * @type {number[]}
         */
        this.indices = [];

    }

    /**
     *
     * @param {PathEndPoint} source
     * @param {PathEndPoint} target
     * @param {number[]} indices
     */
    static from(source, target, indices) {
        assert.defined(source, 'source');
        assert.defined(target, 'target');
        assert.defined(indices, 'indices');

        assert.isArray(indices, 'indices');

        const r = new RoadConnection();

        r.source = source;
        r.target = target;
        r.indices = indices;

        return r;
    }

    /**
     *
     * @param {AABB2} result
     * @param {number} width Grid width, required to convert indices to X,Y coordinates
     */
    computeBounds(result, width) {
        const indices = this.indices;
        const n = indices.length;

        if (n === 0) {
            result.set(0, 0, 0, 0);
            return;
        }

        result.setNegativelyInfiniteBounds();

        for (let i = 0; i < n; i++) {

            const index = indices[i];


            const c_x = index % width;
            const c_y = (index / width) | 0;

            result._expandToFitPoint(c_x, c_y);
        }
    }

    /**
     * Test whether index is part of the path or not
     * @param {number} index
     * @returns {boolean}
     */
    test(index) {
        const indices = this.indices;
        const n = indices.length;

        for (let i = 0; i < n; i++) {

            const v = indices[i];

            if (v === index) {
                return true;
            }
        }
    }

    /**
     *
     * @param {MarkerNode} marker
     * @returns {boolean}
     */
    isAttachedToNodeMarker(marker) {
        return this.source.isAttachedToNode(marker) || this.target.isAttachedToNode(marker);
    }

    /**
     *
     * @param {number} id
     * @returns {boolean}
     */
    isAttachedToMarkerGroup(id) {
        return this.source.isAttachedToMarkerGroup(id) || this.target.isAttachedToMarkerGroup(id);
    }
}
