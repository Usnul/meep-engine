import { AbstractShape } from "./AbstractShape.js";
import { circleIntersectsPoint } from "../circle/circleIntersectsPoint.js";
import { circleIntersectsCircle } from "../circle/circleIntersectsCircle.js";

export class CircleShape extends AbstractShape {
    constructor() {
        super();

        /**
         *
         * @type {number}
         */
        this.x = 0;
        /**
         *
         * @type {number}
         */
        this.y = 0;
        /**
         *
         * @type {number}
         */
        this.radius = 0;
    }

    /**
     *
     * @param {CircleShape} other
     */
    copy(other) {
        this.x = other.x;
        this.y = other.y;
        this.radius = other.radius;
    }

    clone() {
        const r = new CircleShape();

        r.copy(this);

        return r;
    }

    intersects(other) {
        if (other.isCircleShape) {
            return this.intersectsCircle(other.x, other.y, other.radius);
        } else if (other.isPointShape) {
            return this.intersectsPoint(other.x, other.y);
        } else {
            throw new Error('Unsupported intersection pairing');
        }
    }

    intersectsPoint(x, y) {
        return circleIntersectsPoint(this.x, this.y, this.radius, x, y);
    }

    intersectsCircle(x, y, radius) {
        return circleIntersectsCircle(x, y, radius, this.x, this.y, this.radius);
    }
}

/**
 *
 * @type {boolean}
 */
CircleShape.prototype.isCircleShape = true;
