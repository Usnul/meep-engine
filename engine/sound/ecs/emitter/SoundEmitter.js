/**
 * Created by Alex on 01/04/2014.
 */


import List from '../../../../core/collection/List.js';
import Vector1 from "../../../../core/geom/Vector1.js";
import { SoundTrack } from "./SoundTrack.js";
import { SoundEmitterFlags } from "./SoundEmitterFlags.js";
import { SoundAttenuationFunction } from "./SoundAttenuationFunction.js";
import { attenuateSoundLinear } from "./attenuateSoundLinear.js";
import { attenuateSoundLogarithmic } from "./attenuateSoundLogarithmic.js";
import { computeHashFloat, computeHashIntegerArray } from "../../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../../core/primitives/strings/StringUtils.js";

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

        /**
         * Type of attenuation used for sound fall-off, this is only used if Attenuation flag is set
         * @type {SoundAttenuationFunction|number}
         */
        this.attenuation = SoundAttenuationFunction.Linear;

        /**
         *
         * @type {number|SoundEmitterFlags}
         */
        this.flags = 0;

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
            attenuation: null,
            /**
             * One of the other nodes, depending on the configuration
             * @type {AudioNode}
             */
            endpoint: null
        };

        /**
         *
         * @type {Vector1}
         */
        this.volume = new Vector1(1);

        this.volume.onChanged.add(function (value) {
            if (nodes.volume !== null) {
                nodes.volume.gain.setValueAtTime(value, 0);
            }
        });

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
     * @deprecated
     * @param {boolean} v
     */
    set isPositioned(v) {
        this.writeFlag(SoundEmitterFlags.Spatialization, v);
    }

    /**
     * @deprecated
     * @return {boolean}
     */
    get isPositioned() {
        return this.getFlag(SoundEmitterFlags.Spatialization);
    }

    /**
     * @return {AudioNode}
     */
    getTargetNode() {
        return this.nodes.endpoint;
    }

    /**
     * @returns {boolean}
     * @param {SoundEmitter} other
     */
    equals(other) {
        return this.channel === other.channel
        && this.flags === other.flags
        && this.__distanceMin === other.__distanceMin
        && this.__distanceMax === other.__distanceMax
        && this.attenuation === other.attenuation
        && this.tracks.equals(other.tracks)
        ;
    }

    /**
     *
     * @return {number}
     */
    hash(){
        return computeHashIntegerArray(
            computeStringHash(this.channel),
            this.flags,
            computeHashFloat(this.__distanceMin),
            computeHashFloat(this.__distanceMax),
            this.attenuation,
            this.tracks.hash()
        );
    }

    /**
     *
     * @param {AudioContext} ctx
     */
    buildNodes(ctx) {
        const nodes = this.nodes;

        nodes.volume = ctx.createGain();

        if (this.getFlag(SoundEmitterFlags.Attenuation)) {
            nodes.attenuation = ctx.createGain();
        }

        if (this.getFlag(SoundEmitterFlags.Spatialization)) {
            nodes.panner = ctx.createPanner();


            //
            nodes.panner.panningModel = 'HRTF';

            // we set up distance model in the most efficient way, since we are ignoring it anyway and use custom distance model via a GainNode instead
            nodes.panner.distanceModel = 'linear';
            nodes.panner.rolloffFactor = 0;
            nodes.panner.refDistance = this.distanceMin;
            nodes.panner.maxDistance = this.distanceMax;

        }

        //do wiring
        if (this.getFlag(SoundEmitterFlags.Attenuation | SoundEmitterFlags.Spatialization)) {
            nodes.attenuation.connect(nodes.panner);
            nodes.volume.connect(nodes.attenuation);

            nodes.endpoint = nodes.panner;
        } else if (this.getFlag(SoundEmitterFlags.Spatialization)) {
            nodes.volume.connect(nodes.panner);

            nodes.endpoint = nodes.panner;
        } else if (this.getFlag(SoundEmitterFlags.Attenuation)) {
            nodes.volume.connect(nodes.attenuation);

            nodes.endpoint = nodes.attenuation;
        } else {
            nodes.endpoint = nodes.volume;
        }

        nodes.volume.gain.setValueAtTime(this.volume.getValue(), 0);
    }

    /**
     *
     * @param {number} distance
     */
    writeAttenuationVolume(distance) {

        let volume;

        if (this.attenuation === SoundAttenuationFunction.Linear) {
            volume = attenuateSoundLinear(distance, this.__distanceMin, this.__distanceMax);
        } else if (this.attenuation === SoundAttenuationFunction.Logarithmic) {
            volume = attenuateSoundLogarithmic(distance, this.__distanceMin, this.__distanceMax);
        } else {
            //unsupported function, don't attenuate
            volume = 1;
        }

        /**
         *
         * @type {GainNode}
         */
        const pv = this.nodes.attenuation;

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
            isPositioned: this.getFlag(SoundEmitterFlags.Spatialization),
            isAttenuated: this.getFlag(SoundEmitterFlags.Attenuation),
            channel: this.channel,
            volume: this.volume.toJSON(),
            tracks: this.tracks.toJSON(),
            distanceMin: this.distanceMin,
            distanceMax: this.distanceMax
        };
    }

    fromJSON(json) {
        if (json.isPositioned !== undefined) {
            this.writeFlag(SoundEmitterFlags.Spatialization, json.isPositioned);
        } else {
            this.clearFlag(SoundEmitterFlags.Spatialization);
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

        if (typeof json.isAttenuated === "boolean") {
            this.writeFlag(SoundEmitterFlags.Attenuation, json.isAttenuated);
        } else {
            this.setFlag(SoundEmitterFlags.Attenuation);
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


