/**
 * Representation of a load request for a virtual texture tile
 */
export class TileRequest {
    /**
     *
     * @param {Tile} tile
     * @param successCallback
     * @param failureCallback
     */
    constructor(tile, successCallback, failureCallback) {
        /**
         *
         * @type {Tile}
         */
        this.tile = tile;

        /**
         *
         * @type {Function[]}
         */
        this.successCallbacks = [successCallback];

        /**
         *
         * @type {Function[]}
         */
        this.failureCallbacks = [failureCallback];
    }

    /**
     *
     * @param {function} success
     * @param {function} failure
     */
    attach(success, failure) {
        this.successCallbacks.push(success);
        this.failureCallbacks.push(failure);
    }
}