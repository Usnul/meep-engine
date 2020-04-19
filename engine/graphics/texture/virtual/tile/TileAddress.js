/**
 * Represents address of a tile in the overall texture pyramid
 */
export class TileAddress {
    /**
     *
     * @constructor
     */
    constructor() {
        /**
         * Mip level of the tile
         * @type {number}
         */
        this.mip = 0;
        /**
         * X address of the tile, this is a sequential integer
         * @type {number}
         */
        this.x = 0;
        /**
         * Y address of the tile, this is a sequential integer
         * @type {number}
         */
        this.y = 0;
    }

    /**
     *
     * @param {TileAddress} other
     * @returns {boolean}
     */
    equals(other) {
        return this.x === other.x && this.y === other.y && this.mip === other.mip;
    }

    /**
     * Returns true if this address is a equal or higher mip level of what requested address
     * @returns {boolean}
     */
    _includes(x, y, mip) {
        if (this.mip < mip) {
            //lower level mip
            return false;
        }
        const mipDelta = this.mip - mip;

        const expectedX = x << mipDelta;

        if (this.x !== expectedX) {
            return false;
        }

        const expectedY = y << mipDelta;

        if (this.y !== expectedY) {
            return false;
        }

        //match
        return true;
    }
}

