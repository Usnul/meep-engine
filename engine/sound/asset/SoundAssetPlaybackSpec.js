import { assert } from "../../../core/assert.js";
import { SoundAssetPlaybackSpecFlags } from "./SoundAssetPlaybackSpecFlags.js";

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

        /**
         *
         * @type {SoundAssetPlaybackSpecFlags|number}
         */
        this.flags = 0;
    }


    /**
     *
     * @param {number|SoundAssetPlaybackSpecFlags} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|SoundAssetPlaybackSpecFlags} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|SoundAssetPlaybackSpecFlags} flag
     * @param {boolean} value
     */
    writeFlag(flag, value) {
        if (value) {
            this.setFlag(flag);
        } else {
            this.clearFlag(flag);
        }
    }

    /**
     *
     * @param {number|SoundAssetPlaybackSpecFlags} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }

    /**
     *
     * @param {number} value
     */
    multiplyVolume(value) {
        this.setVolume(value * this.volume);
    }

    /**
     *
     * @param {number} value
     */
    setVolume(value) {

        assert.isNumber(value, 'value');
        assert.notNaN(value, 'value');

        this.volume = value;
    }

    /**
     *
     * @param {SoundAssetPlaybackSpec} other
     */
    copy(other) {
        this.source = other.source;
        this.volume = other.volume;
        this.flags = other.flags;
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

    fromJSON({
                 volume = 1,
                 source,
                 isSourceAlias = false
             }) {

        this.volume = volume;
        this.source = source;

        this.setFlag(SoundAssetPlaybackSpecFlags.UsingAlias, isSourceAlias);
    }

    toJSON() {
        return {
            volume: this.volume,
            source: this.source,
            isSourceAlias: this.getFlag(SoundAssetPlaybackSpecFlags.UsingAlias)
        }
    }
}
