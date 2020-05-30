import { v2_distance } from "../../Vector2.js";

/**
 *
 * @param {number} cx Center of the circle
 * @param {number} cy Center of the circle
 * @param {number} cr Radius of the circle
 * @param {number} px Point coordinate X
 * @param {number} py Point coordinate Y
 * @returns {boolean}
 */
export function circleIntersectsPoint(cx, cy, cr, px, py) {
    const distance = v2_distance(cx, cx, px, py);

    return distance < cr;
}
