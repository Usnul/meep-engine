export class AbstractShape {
    constructor() {
    }

    copy(other) {
        throw new Error('Not implemented');
    }

    /**
     * @returns {AbstractShape}
     */
    clone() {
        throw new Error('Not implemented');
    }

    /**
     *
     * @param {AbstractShape} other
     * @returns {boolean}
     */
    intersects(other) {
        throw new Error('Not implemented');
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    intersectsPoint(x, y) {
        throw new Error('Not implemented');
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @returns {boolean}
     */
    intersectsCircle(x, y, radius) {
        throw new Error('Not implemented');
    }
}
