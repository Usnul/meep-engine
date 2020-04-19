/**
 *
 * @constructor
 */
import { Tile } from "./Tile.js";
import { TileStatus } from "./TileStatus.js";
import { TileRequest } from "./TileRequest.js";


export class TileLoader {
    /**
     *
     * @param {AssetManager} assetManager
     */
    constructor(assetManager) {
        /**
         * @type {AssetManager}
         */
        this.assetManager = assetManager;
        /**
         * number of tiles to be loaded concurrently
         * @type {number}
         */
        this.concurrency = 3;

        /**
         * Set of tiles that are currently being loaded
         * @type {Set<TileRequest>}
         */
        this.pending = new Set();

        /**
         * Requested tiles that are not yet being loaded
         * @type {TileRequest[]}
         */
        this.queue = [];
    }

    /**
     *
     * @param {TileAddress} address
     */
    promote(address) {
        const i = this.indexOfQueueRequestByTile(address);
        if (i === -1) {
            //couldn't find, nothing to do
            return;
        }
        //cut and put in the front
        const requests = this.queue.splice(i, 1);
        this.queue.unshift(requests[0]);
    }

    /**
     *
     * @param {TileAddress} address
     * @returns {number}
     */
    indexOfQueueRequestByTile(address) {
        const queue = this.queue;
        const l = queue.length;
        for (let i = 0; i < l; i++) {
            const request = queue[i];
            const tile = request.tile;
            if (tile.address.equals(address)) {
                return i;
            }
        }

        return -1;
    }

    /**
     *
     * @param {TileAddress} address
     * @returns {boolean}
     */
    remove(address) {
        const i = this.indexOfQueueRequestByTile(address);
        if (i !== -1) {
            this.queue.splice(i, 1);
            return true;
        } else {
            //TODO check pending queue, cancel load
        }
    }

    /**
     *
     * @param {Tile} tile
     * @param {function(tile:Tile)} successCallback
     * @param {function(tile:Tile)} failureCallback
     */
    add(tile, successCallback, failureCallback) {
        for (let request of this.pending) {
            if (request.tile.address.equals(tile.address)) {
                //tile is already being loaded
                request.attach(successCallback, failureCallback);
                return;
            }
        }

        tile.status = TileStatus.Queued;

        const request = new TileRequest(tile, successCallback, failureCallback);

        this.queue.push(request);
        this.prod();
    }

    /**
     * Initialize loading of a tile
     * @param {TileRequest} request
     */
    load(request) {
        this.pending.add(request);

        const tile = request.tile;
        const url = tileToURL(tile);
        tile.status = TileStatus.Loading;

        const self = this;

        function loadFinished() {
            self.pending.delete(request);
            self.prod();
        }

        function success(asset) {
            tile.status = TileStatus.Loaded;
            tile.sampler = asset.create();

            request.successCallbacks.forEach(function (cb) {
                cb(tile);
            });

            loadFinished();
        }

        function failure() {
            //oh well?
            request.failureCallbacks.forEach(function (cb) {
                cb(tile);
            });

            loadFinished();
        }

        //do load
        this.assetManager.get('image', url, success, failure);
    }

    /**
     * Attempt to start loading another tile as long as it's within the concurrency limit, otherwise does nothing
     * @private
     */
    prod() {
        while (this.pending < this.concurrency) {
            const request = this.queue.shift();
            this.load(request);
        }
    }
}

/**
 * Constructs a tile URL
 * @param {Tile} tile
 * @returns {string}
 */
function tileToURL(tile) {
    const address = tile.address;
    return `${address.mip}$${address.x}_${address.y}`;
}
