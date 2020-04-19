/**
 * Created by Alex on 01/04/2014.
 */


import List from '../../../core/collection/List.js';
import Vector1 from "../../../core/geom/Vector1.js";
import Signal from "../../../core/events/signal/Signal.js";
import { BinaryClassSerializationAdapter } from "../../ecs/storage/binary/BinaryClassSerializationAdapter.js";

/**
 * Convert decibel to percentage volume
 * @param {number} dB
 * @returns {number}
 */
function dB2Volume(dB) {
    return Math.pow(10, 0.05 * dB);
}

/**
 * Convert percentage volume to decibel
 * @param {number} volume
 * @returns {number}
 */
function volume2dB(volume) {
    return 20 * Math.log10(volume);
}

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
         * @type {boolean}
         */
        this.loop = false;
        /**
         *
         * @type {number}
         */
        this.time = 0;

        /**
         * TODO this attribute is currently ignored, instead channel is common to entire emitter
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
         * @type {boolean}
         */
        this.playing = false;
        /**
         *
         * @type {boolean}
         */
        this.startWhenReady = true;

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
     *
     * @param {SoundTrack} other
     */
    copy(other) {
        this.url = other.url;
        this.loop = other.loop;
        this.time = other.time;
        this.channel = other.channel;
        this.volume = other.volume;
        this.playing = other.playing;
        this.startWhenReady = other.startWhenReady;
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
            channel,
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

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    toBinaryBuffer(buffer) {
        buffer.writeUTF8String(this.url);

        buffer.writeUint8(this.loop ? 1 : 0);

        buffer.writeFloat32(this.time);

        buffer.writeUTF8String(this.channel);

        buffer.writeUint8(this.playing ? 1 : 0);

        buffer.writeUint8(this.startWhenReady ? 1 : 0);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        this.url = buffer.readUTF8String();

        this.loop = buffer.readUint8() !== 0;

        this.time = buffer.readFloat32();

        this.channel = buffer.readUTF8String();

        this.playing = buffer.readUint8() !== 0;

        this.startWhenReady = buffer.readUint8() !== 0;
    }
}

export class SoundEmitter {
    /**
     *
     * @constructor
     */
    constructor() {

        /**
         *
         * @type {List<SoundTrack>}
         */
        this.tracks = new List();

        this.isPositioned = false;

        /**
         *
         * @type {String|SoundEmitterChannels|null}
         */
        this.channel = null;

        this.distanceMin = 1;
        this.distanceMax = 10000;
        this.distanceRolloff = 1;

        const nodes = this.nodes = {
            volume: null,
            panner: null
        };

        this.volume = new Vector1(1);

        this.volume.onChanged.add(function (value) {
            if (nodes.volume !== null) {
                nodes.volume.gain.setValueAtTime(value, 0);
            }
        });
    }

    toJSON() {
        return {
            isPositioned: this.isPositioned,
            channel: this.channel,
            volume: this.volume.toJSON(),
            tracks: this.tracks.toJSON(),
            distanceMin: this.distanceMin,
            distanceMax: this.distanceMax,
            distanceRolloff: this.distanceRolloff
        };
    }

    fromJSON(json) {
        if (json.isPositioned !== undefined) {
            this.isPositioned = json.isPositioned;
        }
        if (json.channel !== undefined) {
            this.channel = json.channel;
        }
        if (json.volume !== undefined) {
            this.volume.fromJSON(json.volume);
        }
        if (typeof json.distanceMin === "number") {
            this.distanceMin = json.distanceMin;
        }
        if (typeof json.distanceMax === "number") {
            this.distanceMax = json.distanceMax;
        }
        if (typeof json.distanceRolloff === "number") {
            this.distanceRolloff = json.distanceRolloff;
        }

        //tracks
        if (json.tracks !== undefined) {
            this.tracks.fromJSON(json.tracks, SoundTrack);
        }
    }


    /**
     *
     * @param json
     * @returns {SoundEmitter}
     */
    static fromJSON(json) {
        const result = new SoundEmitter();

        result.fromJSON(json);

        return result;
    }
}

SoundEmitter.typeName = "SoundEmitter";

SoundEmitter.Track = SoundTrack;


export class SoundEmitterSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = SoundEmitter;
        this.version = 0;
    }


    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {SoundEmitter} value
     */
    serialize(buffer, value) {
        buffer.writeUint8(value.isPositioned ? 1 : 0);
        buffer.writeUTF8String(value.channel);

        value.volume.toBinaryBuffer(buffer);
        value.tracks.toBinaryBuffer(buffer);

        buffer.writeFloat64(value.distanceMin);
        buffer.writeFloat64(value.distanceMax);
        buffer.writeFloat64(value.distanceRolloff);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {SoundEmitter} value
     */
    deserialize(buffer, value) {
        value.isPositioned = buffer.readUint8() !== 0;
        value.channel = buffer.readUTF8String();

        value.volume.fromBinaryBuffer(buffer);
        value.tracks.fromBinaryBuffer(buffer, SoundTrack);

        value.distanceMin = buffer.readFloat64();
        value.distanceMax = buffer.readFloat64();
        value.distanceRolloff = buffer.readFloat64();
    }
}
