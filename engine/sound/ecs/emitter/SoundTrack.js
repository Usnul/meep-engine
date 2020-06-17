import Signal from "../../../../core/events/signal/Signal.js";
import { SoundTrackFlags } from "./SoundTrackFlags.js";

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
        this.channel = other.channel;
        this.volume = other.volume;
        this.flags = other.flags;
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
            loop: this.loop,
            time: this.time,
            volume: this.volume,
            channel: this.channel,
            playing: this.playing,
            startWhenReady: this.startWhenReady
        };
    }

    fromJSON(
        {
            url,
            loop = false,
            time = 0,
            volume = 1,
            channel = null,
            playing = false,
            startWhenReady = true
        }
    ) {
        this.url = url;

        this.loop = loop;

        this.time = time;

        this.volume = volume;

        this.channel = channel;

        this.playing = playing;

        this.startWhenReady = startWhenReady;
    }

    static fromJSON(json) {
        const track = new SoundTrack();

        track.fromJSON(json);

        return track;
    }

}
