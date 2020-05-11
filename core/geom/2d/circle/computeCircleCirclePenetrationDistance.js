/**
 *
 * @param {number} ax Center of first circle
 * @param {number} ay Center of first circle
 * @param {number} ar Radius of first circle
 * @param {number} bx Center of second circle
 * @param {number} by Center of second circle
 * @param {number} br Radius of second circle
 * @returns {number} positive value means that there is penetration, negative means that circles are separated
 */
export function computeCircleCirclePenetrationDistance(ax, ay, ar, bx, by, br) {
    const dx = bx - ax;
    const dy = by - ax;

    /**
     * Compute distance between circle centers
     * @type {number}
     */
    const distance = Math.sqrt(dx * dx + dy * dy);

    /**
     * Minimum distance between circle centers for them to not overlap
     * @type {number}
     */
    const minSeparation = ar + br;

    const result = minSeparation - distance;

    return result;
}
