import { v2_distance } from "../../Vector2.js";

/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} r0 Radius of first circle
 * @param {number} x1
 * @param {number} y1
 * @param {number} r1 Radius is second circle
 * @returns {boolean}
 */
export function circleIntersectsCircle(x0, y0, r0, x1, y1, r1) {
    const minSeparation = r0 + r1;

    const distance = v2_distance(x0, y0, x1, y1);

    return distance < minSeparation;
}
