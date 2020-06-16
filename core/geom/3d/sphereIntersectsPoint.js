/**
 *
 * @param {number} center_x
 * @param {number} center_y
 * @param {number} center_z
 * @param {number} radius
 * @param {number} p_x
 * @param {number} p_y
 * @param {number} p_z
 * @returns {boolean}
 */
export function sphereIntersectsPoint(center_x, center_y, center_z, radius, p_x, p_y, p_z) {

    //compute offset vector
    const dx = center_x - p_x;
    const dy = center_y - p_y;
    const dz = center_z - p_z;

    //compute distance between center and the point
    const distance_sqr = dx * dx + dy * dy + dz * dz;

    //to avoid taking square root, we will compare squared distances
    const radius_sqr = radius * radius;

    return distance_sqr < radius_sqr;
}
