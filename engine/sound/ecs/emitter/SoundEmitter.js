/**
 * Created by Alex on 01/04/2014.
 */


import List from '../../../../core/collection/List.js';
import Vector1 from "../../../../core/geom/Vector1.js";
import Signal from "../../../../core/events/signal/Signal.js";
import { BinaryClassSerializationAdapter } from "../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import { LeafNode } from "../../../../core/bvh2/LeafNode.js";
import { clamp, inverseLerp } from "../../../../core/math/MathUtils.js";

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

        /**
         *
         * @type {number}
         * @private
         */
        this.__distanceMin = 1;

        /**
         *
         * @type {number}
         * @private
         */
        this.__distanceMax = 10000;

        /**
         * @deprecated
         * @type {number}
         * @private
         */
        this.__distanceRolloff = 1;

        const nodes = this.nodes = {
            /**
             * @type {GainNode}
             */
            volume: null,
            /**
             * @type {PannerNode}
             */
            panner: null,
            /**
             * @type {GainNode}
             */
            pannerVolume: null
        };

        this.volume = new Vector1(1);

        this.volume.onChanged.add(function (value) {
            if (nodes.volume !== null) {
                nodes.volume.gain.setValueAtTime(value, 0);
            }
        });

        /**
         *
         * @type {LeafNode}
         */
        this.__bvhLeaf = new LeafNode(this, 0, 0, 0, 0, 0, 0);
    }

    /**
     * @return {AudioNode}
     */
    getTargetNode() {
        if (this.isPositioned) {
            return this.nodes.panner;
        } else {
            return this.nodes.volume;
        }
    }

    /**
     *
     * @param {AudioContext} ctx
     */
    buildNodes(ctx) {
        const nodes = this.nodes;

        nodes.volume = ctx.createGain();

        if (this.isPositioned) {
            nodes.panner = ctx.createPanner();


            //
            nodes.panner.panningModel = 'HRTF';

            // we set up distance model in the most efficient way, since we are ignoring it anyway and use custom distance model via a GainNode instead
            nodes.panner.distanceModel = 'linear';
            nodes.panner.rolloffFactor = 0;
            nodes.panner.refDistance = this.distanceMin;
            nodes.panner.maxDistance = this.distanceMax;

            nodes.pannerVolume = ctx.createGain();

            //wire
            nodes.pannerVolume.connect(nodes.panner);
            nodes.volume.connect(nodes.pannerVolume);
        }

        nodes.volume.gain.setValueAtTime(this.volume.getValue(), 0);
    }

    /**
     *
     * @param {number} distance
     */
    writePannerVolume(distance) {
        const normalizedDistance = clamp(
            inverseLerp(this.__distanceMin, this.__distanceMax, distance),
            0,
            1
        );

        const invDistance = 1 - normalizedDistance;

        const volume = invDistance * invDistance;

        /**
         *
         * @type {GainNode}
         */
        const pv = this.nodes.pannerVolume;

        if (pv !== null) {
            pv.gain.setValueAtTime(volume, 0);
        }
    }

    /**
     *
     * @returns {number}
     */
    get distanceMin() {
        return this.__distanceMin;
    }

    /**
     * @param {number} v
     */
    set distanceMin(v) {
        this.__distanceMin = v;
    }

    /**
     *
     * @returns {number}
     */
    get distanceMax() {
        return this.__distanceMax;
    }

    /**
     * @param {number} v
     */
    set distanceMax(v) {
        this.__distanceMax = v;
    }


    /**
     * @deprecated
     * @returns {number}
     */
    get distanceRolloff() {
        return this.__distanceRolloff;
    }

    /**
     * @deprecated
     * @param {number} v
     */
    set distanceRolloff(v) {
        this.__distanceRolloff = v;

        const panner = this.nodes.panner;

        if (panner !== null) {
            panner.rolloffFactor = v;
        }
    }

    stopAllTracks() {
        const tracks = this.tracks;
        const n = tracks.length;

        for (let i = 0; i < n; i++) {
            const soundTrack = tracks.get(i);

            soundTrack.playing = false;
        }
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
