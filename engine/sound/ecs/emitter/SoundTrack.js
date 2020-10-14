import Signal from "../../../../core/events/signal/Signal.js";
import { SoundTrackFlags } from "./SoundTrackFlags.js";
import { computeStringHash } from "../../../../core/primitives/strings/StringUtils.js";
import { computeHashFloat, computeHashIntegerArray } from "../../../../core/math/MathUtils.js";

const DEFAULT_FLAGS = SoundTrackFlags.StartWhenReady;

export class SoundTrack {
    /**
     *
     * @constructor
     */
    constructor() {
        /**
         *
         * @type {String|null}
         */
        this.url = null;

        /**
         *
         * @type {number}
         */
        this.time = 0;

        /**
         * @deprecated Not used
         * @type {String|null}
         */
        this.channel = "";

        /**
         * @private
         * @type {number}
         */
        this.__volume = 1;


        /**
         *
         * @type {number|SoundTrackFlags}
         */
        this.flags = DEFAULT_FLAGS;

        this.on = {
            ended: new Signal()
        };

        /**
         * @private
         * @type {SoundTrackNodes}
         */
        this.nodes = null;
    }

    /**
     *
     * @param {number|SoundEmitterFlags} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|SoundEmitterFlags} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|SoundEmitterFlags} flag
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
     * @param {number|SoundEmitterFlags} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }

    /**
     * Linearly transition volume to a target value over a certain duration.
     * Useful for fading sounds in and out of the mix.
     *
     * NOTE: volume property of the object is updated instantly, transition happens at the AudioNode level only
     *
     * @param {number} target target volume value
     * @param {number} duration How long the transition should take, in seconds
     * @param {number} [startAfter] when fading should start, see WebAudio docs on {@link AudioContext#currentTime}
     */
    setVolumeOverTime(target, duration, startAfter = 0) {
        // instantly update volume for consistency purposes wrt serialization
        this.__volume = target;

        const nodes = this.nodes;
        if (nodes !== null) {

            /**
             *
             * @type {GainNode}
             */
            const volume_node = nodes.volume;

            /**
             *
             * @type {AudioParam}
             */
            const gain = volume_node.gain;

            const current_value = gain.value;

            let start_time = startAfter;

            /**
             * @type {AudioContext}
             */
            const audioContext = volume_node.context;

            if (audioContext !== undefined) {
                start_time += audioContext.currentTime;
            }

            gain.setValueCurveAtTime([current_value, target], start_time, duration);
        }
    }

    /**
     *
     * @param {number} v
     */
    set volume(v) {
        this.__volume = v;

        if (this.nodes !== null) {
            this.nodes.volume.gain.setValueAtTime(v, 0);
        }
    }

    /**
     *
     * @return {number}
     */
    get volume() {
        return this.__volume;
    }

    /**
     * @deprecated
     * @return {boolean}
     */
    get loop() {
        return this.getFlag(SoundTrackFlags.Loop);
    }

    /**
     * @deprecated
     * @param {boolean} v
     */
    set loop(v) {
        this.writeFlag(SoundTrackFlags.Loop, v);
    }

    /**
     * @deprecated
     * @return {boolean}
     */
    get playing() {
        return this.getFlag(SoundTrackFlags.Playing);
    }

    /**
     * @deprecated
     * @param {boolean} v
     */
    set playing(v) {
        this.writeFlag(SoundTrackFlags.Playing, v);
    }

    /**
     * @deprecated
     * @return {boolean}
     */
    get startWhenReady() {
        return this.getFlag(SoundTrackFlags.StartWhenReady);
    }

    /**
     * @deprecated
     * @param {boolean} v
     */
    set startWhenReady(v) {
        this.writeFlag(SoundTrackFlags.StartWhenReady, v);
    }

    /**
     *
     * @param {SoundTrack} other
     */
    copy(other) {
        this.url = other.url;
        this.time = other.time;
        this.volume = other.volume;
        this.flags = other.flags;
    }

    /**
     *
     * @param {SoundTrack} other
     * @returns {boolean}
     */
    equals(other) {
        return this.url === other.url
            && this.time === other.time
            && this.__volume === other.__volume
            && this.flags === other.flags
            ;
    }

    /**
     *
     * @return {number}
     */
    hash() {
        return computeHashIntegerArray(
            computeStringHash(this.url),
            computeHashFloat(this.time),
            computeHashFloat(this.__volume),
            this.flags
        );
    }

    /**
     *
     * @return {SoundTrack}
     */
    clone() {
        const r = new SoundTrack();

        r.copy(this);

        return r;
    }

    toJSON() {
        return {
            url: this.url,
            loop: this.getFlag(SoundTrackFlags.Loop),
            time: this.time,
            volume: this.volume,
            playing: this.getFlag(SoundTrackFlags.Playing),
            startWhenReady: this.getFlag(SoundTrackFlags.StartWhenReady),
            usingAssetAlias: this.getFlag(SoundTrackFlags.UsingAliasURL)
        };
    }

    fromJSON(
        {
            url,
            loop = false,
            time = 0,
            volume = 1,
            playing = false,
            startWhenReady = true,
            usingAssetAlias = false
        }
    ) {
        this.url = url;

        this.writeFlag(SoundTrackFlags.Loop, loop);

        this.writeFlag(SoundTrackFlags.UsingAliasURL, usingAssetAlias);

        this.time = time;

        this.volume = volume;

        this.writeFlag(SoundTrackFlags.Playing, playing);

        this.writeFlag(SoundTrackFlags.StartWhenReady, startWhenReady);
    }

    static fromJSON(json) {
        const track = new SoundTrack();

        track.fromJSON(json);

        return track;
    }

}
