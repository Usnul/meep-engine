import Vector2 from "../../core/geom/Vector2.js";
import { Transform } from "../../engine/ecs/components/Transform.js";
import { copyArray } from "../../core/collection/array/copyArray.js";
import { circleIntersectsCircle } from "../../core/geom/2d/circle/circleIntersectsCircle.js";

export class MarkerNode {
    constructor() {
        /**
         *
         * @type {String}
         */
        this.type = null;

        /**
         *
         * @type {String[]}
         */
        this.tags = [];

        /**
         * Grid position
         * @type {Vector2}
         */
        this.position = new Vector2();

        /**
         * World transform, this can differ from the grid position
         * @type {Transform}
         */
        this.transform = new Transform();

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
     * @returns {MarkerNode}
     */
    clone() {
        const r = new MarkerNode();

        r.copy(this);

        return r;
    }

    /**
     *
     * @param {MarkerNode} other
     */
    copy(other) {
        this.type = other.type;

        copyArray(other.tags, this.tags);

        this.position.copy(other.position);

        this.transform.copy(other.transform);

        this.size = other.size;

        this.properties = Object.assign({}, other.properties);
    }

    /**
     *
     * @param {MarkerNode} other
     * @returns {boolean}
     */
    overlaps(other) {
        const p0 = this.transform.position;
        const p1 = other.transform.position;

        return circleIntersectsCircle(p0.x, p0.y, this.size, p1.x, p1.y, other.size);
    }

}

/**
 * @readonly
 * @type {boolean}
 */
MarkerNode.prototype.isMarkerNode = true;
