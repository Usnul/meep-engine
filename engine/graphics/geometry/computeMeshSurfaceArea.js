/**
 *
 * @param {Float32Array} result Area of individual polygons will be written here
 * @param {Float32Array} points
 * @param {Uint8Array|Uint16Array|Uint32Array} indices
 * @param {number} [polygon_count]
 * @returns {number} total surface area
 */
import { assert } from "../../../core/assert.js";

export function computeMeshSurfaceArea(result, points, indices, polygon_count = indices.length / 3) {
    assert.lessThanOrEqual(polygon_count, indices.length / 3, 'index underflow');

    let total = 0;

    for (let i = 0; i < polygon_count; i++) {
        const index3 = i * 3;

        const a = indices[index3];
        const b = indices[index3 + 1];
        const c = indices[index3 + 2];

        //read points
        const a3 = a * 3;

        const x0 = points[a3];
        const y0 = points[a3 + 1];
        const z0 = points[a3 + 2];

        const b3 = b * 3;

        const x1 = points[b3];
        const y1 = points[b3 + 1];
        const z1 = points[b3 + 2];

        const c3 = c * 3;

        const x2 = points[c3];
        const y2 = points[c3 + 2];
        const z2 = points[c3 + 2];

        const area = computeTriangleSurfaceArea(x0, y0, z0, x1, y1, z1, x2, y2, z2);

        assert.notNaN(area, 'area');

        result[i] = area;

        total += area;
    }

    return total;
}


/**
 * Based on: https://gamedev.stackexchange.com/questions/165643/how-to-calculate-the-surface-area-of-a-mesh
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @param {number} x2
 * @param {number} y2
 * @param {number} z2
 * @returns {number}
 */
export function computeTriangleSurfaceArea(x0, y0, z0, x1, y1, z1, x2, y2, z2) {
    const ax = x1 - x0;
    const ay = y1 - y0;
    const az = z1 - z0;

    const bx = x2 - x0;
    const by = y2 - y0;
    const bz = z2 - z0;

    //compute cross product
    const x = ay * bz - az * by;
    const y = az * bx - ax * bz;
    const z = ax * by - ay * bx;

    //area is equal to half-magnitude of the cross-product
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    const area = magnitude / 2;

    return area;
}
