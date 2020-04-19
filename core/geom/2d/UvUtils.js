import { sign } from "../../math/MathUtils.js";

/**
 * based on paper "Elliptification of Rectangular Imagery" by Chamberlain Fong, Joint Mathematics Meetings 2019, SIGMAA-ARTS
 * @param {Vector2} result
 * @param {number} u
 * @param {number} v
 */
export function uv_mapCircleToSquare(result, u, v) {
    if (u === 0 || v === 0) {
        //special case
        result.set(u, v);

        return;
    }

    const sign_uv = sign(u * v);

    const beta = 4 * u * u * v * v;

    let alpha;

    if (beta >= 1) {
        //avoid numeric instability as well as square root function
        alpha = 1
    } else {
        alpha = Math.sqrt(1 - Math.sqrt(1 - (beta)));
    }

    const x = (sign_uv / (v * Math.SQRT2)) * alpha;
    const y = (sign_uv / (u * Math.SQRT2)) * alpha;

    result.set(x, y);
}

/**
 * based on paper "Elliptification of Rectangular Imagery" by Chamberlain Fong, Joint Mathematics Meetings 2019, SIGMAA-ARTS
 * @param {Vector2} result
 * @param {number} x
 * @param {number} y
 */
export function uv_mapSquareToCircle(result, x, y) {
    const alpha = Math.sqrt(1 + x * x * y * y);

    const u = x / alpha;
    const v = y / alpha;

    result.set(u, v);
}
