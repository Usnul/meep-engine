import { sdnoise3 } from "./sdnoise.js";

const p_x0 = [];
const p_y0 = [];
const p_z0 = [];

/**
 *
 * @param {number[]} result
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} w
 */
export function curl_noise_3dt(result, x, y, z, w) {

    sdnoise3(p_x0, x + w, y, z);
    sdnoise3(p_y0, x + 31.341, y - 43.23 + w, z + 12.34);
    sdnoise3(p_z0, x - 231.141, y + 124.123, z + -54.4341 + w);

    const _x = p_z0[1] - p_y0[2];
    const _y = p_x0[2] - p_z0[0];
    const _z = p_y0[0] - p_x0[1];

    result[0] = _x;
    result[1] = _y;
    result[2] = _z;
}
