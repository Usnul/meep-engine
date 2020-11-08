import { assert } from "../../core/assert.js";

export class SoundAssetPlaybackSpec {
    constructor() {

        /**
         *
         * @type {string}
         */
        this.source = "";

        /**
         *
         * @type {number}
         */
        this.volume = 1;

    }

    /**
     *
     * @param {number} value
     */
    multiplyVolume(value) {
        assert.isNumber(value, 'value');
        assert.notNaN(value, 'value');

        this.volume *= value;
    }

    /**
     *
     * @param {SoundAssetPlaybackSpec} other
     */
    copy(other) {
        this.source = other.source;
        this.volume = other.volume;
    }

    /**
     *
     * @return {SoundAssetPlaybackSpec}
     */
    clone() {
        const r = new SoundAssetPlaybackSpec();

        r.copy(this);

        return r;
    }
}
