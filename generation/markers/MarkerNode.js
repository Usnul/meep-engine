import Vector2 from "../../core/geom/Vector2.js";
import { Transform } from "../../engine/ecs/components/Transform.js";

export class MarkerNode {
    constructor() {
        /**
         *
         * @type {String}
         */
        this.type = null;

        this.position = new Vector2();

        this.transofrm = new Transform();

        /**
         * Treated as a radius
         * Used for spatial resolution, to allow spacing markers
         * @type {number}
         */
        this.size = 0;

        /**
         *
         * @type {Object}
         */
        this.properties = {};
    }

    /**
     *
     * @param {MarkerNode} other
     * @returns {boolean}
     */
    overlaps(other) {

        const penetrationDistance = computeCircleCirclePenetrationDistance(
            this.position.x,
            this.position.y,
            this.size,
            other.position.x,
            other.position.y,
            other.size
        );

        return penetrationDistance > 0;
    }

}

/**
 * @readonly
 * @type {boolean}
 */
MarkerNode.prototype.isMarkerNode = true;
