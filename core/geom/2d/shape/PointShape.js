import { AbstractShape } from "./AbstractShape.js";
import { circleIntersectsPoint } from "../circle/circleIntersectsPoint.js";

export class PointShape extends AbstractShape {
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
    }

    intersectsPoint(x, y) {
        //points can never intersect as there is no area
        return false;
    }

    intersectsCircle(x, y, radius) {
        return circleIntersectsPoint(x, y, radius, this.x, this.y);
    }
}

/**
 * @readonly
 * @type {boolean}
 */
PointShape.prototype.isPointShape = true;
