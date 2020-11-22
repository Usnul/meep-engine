import Vector2 from "../../../../geom/Vector2.js";

export class ConnectionEndpointLayoutSpec {
    constructor() {

        /**
         *
         * @type {BoxLayoutSpec}
         */
        this.box = null;

        /**
         * Local offset inside the box where connection is attached
         * @type {Vector2}
         */
        this.point = null;

    }

    /**
     *
     * @param {Vector2} result
     */
    computePosition(result) {
        result.set(
            this.point.x + this.box.x0,
            this.point.y + this.box.y0
        );
    }

    /**
     * @param {AABB2} box
     * @param {Vector2} point
     * @returns {ConnectionEndpointLayoutSpec}
     */
    static from(box, point) {
        const r = new ConnectionEndpointLayoutSpec();

        r.box = box;
        r.point = point;

        return r;
    }
}
