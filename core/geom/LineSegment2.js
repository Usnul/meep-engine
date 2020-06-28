/**
 * 2-D line Mathematics
 * @author Alex Goldring 2019
 * @copyright Alex Goldring 2019
 */

/**
 *
 * @constructor
 */
function LineSegment2() {

}

/**
 * @param {Vector2} p0
 * @param {Vector2} p1
 * @param {Vector2} p2
 * @param {Vector2} p3
 * @returns {[number,number]}
 */
export function computeLine2Intersection(p0, p1, p2, p3) {
    const p0_x = p0.x;
    const p0_y = p0.y;
    const p1_x = p1.x;
    const p1_y = p1.y;
    const p2_x = p2.x;
    const p2_y = p2.y;
    const p3_x = p3.x;
    const p3_y = p3.y;

    const result = [];

    if (line2_line2_intersection(result, p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y)) {
        return result;
    } else {
        return null; // No collision
    }

}

/**
 *
 * @param {number[]} result
 * @param {number} a0_x
 * @param {number} a0_y
 * @param {number} a1_x
 * @param {number} a1_y
 * @param {number} b2_x
 * @param {number} b2_y
 * @param {number} b3_x
 * @param {number} b3_y
 * @return {boolean}
 */
export function line2_line2_intersection(result, a0_x, a0_y, a1_x, a1_y, b2_x, b2_y, b3_x, b3_y) {

    const s1_x = a1_x - a0_x;
    const s1_y = a1_y - a0_y;
    const s2_x = b3_x - b2_x;
    const s2_y = b3_y - b2_y;

    const dy_02 = a0_y - b2_y;
    const dx_02 = a0_x - b2_x;

    const denom = -s2_x * s1_y + s1_x * s2_y;

    const s = (-s1_y * dx_02 + s1_x * dy_02) / denom;
    const t = (s2_x * dy_02 - s2_y * dx_02) / denom;

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        // Collision detected

        const intX = a0_x + (t * s1_x);
        const intY = a0_y + (t * s1_y);

        result[0] = intX;
        result[1] = intY;

        return true;
    }

    return false; // No collision
}

/**
 * Adapted from answer by iMalc from stackoverflow.com "how do you detect where two line segments intersect"
 * @link https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
 * @param {Vector2} a0 start of first segment
 * @param {Vector2} a1 end of first segment
 * @param {Vector2} b0 start of second segment
 * @param {Vector2} b1 end of second segment
 * @param {Vector2} result resulting intersection point will be stored here if intersection exists
 * @returns {boolean} True if segments intersect, False otherwise
 */
function intersectionPoint(a0, a1, b0, b1, result) {
    return intersectionPointRaw(a0.x, a0.y, a1.x, a1.y, b0.x, b0.y, b1.x, b1.y, result);
}

/**
 *
 * @param {number} a0_x
 * @param {number} a0_y
 * @param {number} a1_x
 * @param {number} a1_y
 * @param {number} b0_x
 * @param {number} b0_y
 * @param {number} b1_x
 * @param {number} b1_y
 * @returns {boolean} True if segments intersect, False otherwise
 * @public
 */
export function line2SegmentsIntersect(a0_x, a0_y, a1_x, a1_y, b0_x, b0_y, b1_x, b1_y) {
    const s1_x = a1_x - a0_x;
    const s1_y = a1_y - a0_y;
    const s2_x = b1_x - b0_x;
    const s2_y = b1_y - b0_y;


    const denom = (-s2_x * s1_y + s1_x * s2_y);

    const dy0_ab = a0_y - b0_y;
    const dx0_ab = a0_x - b0_x;

    const s = (-s1_y * dx0_ab + s1_x * dy0_ab) / denom;
    const t = (s2_x * dy0_ab - s2_y * dx0_ab) / denom;

    return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}


/**
 *
 * @param {number} a0_x
 * @param {number} a0_y
 * @param {number} a1_x
 * @param {number} a1_y
 * @param {number} b0_x
 * @param {number} b0_y
 * @param {number} b1_x
 * @param {number} b1_y
 * @param {Vector2} result resulting intersection point will be stored here if intersection exists
 * @returns {boolean} True if segments intersect, False otherwise
 * @public
 */
function intersectionPointRaw(a0_x, a0_y, a1_x, a1_y, b0_x, b0_y, b1_x, b1_y, result) {
    const s1_x = a1_x - a0_x;
    const s1_y = a1_y - a0_y;
    const s2_x = b1_x - b0_x;
    const s2_y = b1_y - b0_y;


    const denom = (-s2_x * s1_y + s1_x * s2_y);

    const s = (-s1_y * (a0_x - b0_x) + s1_x * (a0_y - b0_y)) / denom;
    const t = (s2_x * (a0_y - b0_y) - s2_y * (a0_x - b0_x)) / denom;

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        // Collision detected

        const i_x = a0_x + (t * s1_x);
        const i_y = a0_y + (t * s1_y);

        result.set(i_x, i_y);

        return true;
    }


    return false;
}

LineSegment2.intersectionPoint = intersectionPoint;
LineSegment2.intersectionPointRaw = intersectionPointRaw;

export default LineSegment2;
