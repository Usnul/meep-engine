/**
 *
 * @constructor
 * @class
 */
import { TileAddress } from "./TileAddress.js";
import { TileStatus } from "./TileStatus.js";


export class Tile {
    constructor() {
        /**
         *
         * @type {TileAddress}
         */
        this.address = new TileAddress();
        /**
         *
         * @type {Sampler2D|null}
         */
        this.sampler = null;
        /**
         *
         * @type {TileStatus}
         */
        this.status = TileStatus.Initial;
        this.referenceCount = 0;
    }

    /**
     *
     * @returns {number}
     */
    byteSize() {
        const sampler = this.sampler;

        if (sampler === null || sampler.data === null || sampler.data === undefined) {
            return 0;
        }

        return sampler.data.length;
    }
}

