import { computeHashIntegerArray, max2, min2 } from "../../../../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../../../../core/primitives/strings/StringUtils.js";
import { assert } from "../../../../../../core/assert.js";
import { ParameterLookupTable } from "./ParameterLookupTable.js";
import List from "../../../../../../core/collection/list/List.js";


export class ParticleParameter {
    /**
     *
     * @param {string} name
     * @param {number} itemSize
     * @constructor
     */
    constructor(name, itemSize) {
        this.name = name;
        this.itemSize = itemSize;

        /**
         *
         * @type {List.<ParameterLookupTable>}
         */
        this.tracks = new List();

        /**
         * Default lookup table value for a track
         * @type {ParameterLookupTable}
         */
        this.defaultTrackValue = new ParameterLookupTable(itemSize);

        /**
         *
         * @type {number}
         */
        this.trackCount = 0;

        /**
         * Statistics of the parameter value data
         * @type {number}
         */
        this.valueMin = 0;
        /**
         * Statistics of the parameter value data
         * @type {number}
         */
        this.valueMax = 0;

        /**
         * Set by the engine, points to texture piece that stores this parameter data
         * @type {AtlasPatch|null}
         */
        this.patch = null;
    }

    toJSON() {
        return {
            name: this.name,
            itemSize: this.itemSize,
            defaultTrackValue: this.defaultTrackValue.toJSON()
        };
    }

    fromJSON(json) {
        this.name = json.name;
        this.itemSize = json.itemSize;

        const defaultTrackValue = json.defaultTrackValue;

        if (Array.isArray(defaultTrackValue)) {
            //legacy format
            this.defaultTrackValue.itemSize = this.itemSize;
            this.defaultTrackValue.write(defaultTrackValue);
        } else {
            this.defaultTrackValue.fromJSON(defaultTrackValue);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    toBinaryBuffer(buffer) {
        buffer.writeUTF8String(this.name);
        buffer.writeUint8(this.itemSize);
        this.defaultTrackValue.toBinaryBuffer(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        this.name = buffer.readUTF8String();
        this.itemSize = buffer.readUint8();
        this.defaultTrackValue.fromBinaryBuffer(buffer);
    }

    /**
     *
     * @param {number} value
     */
    setTrackCount(value) {
        assert.equal(typeof value, 'number', `value expected to be to a number, but instead was '${typeof value}'`);
        assert.ok(Number.isInteger(value), `value expected to be an integer, instead was ${value}`);
        assert.ok(value >= 0, `value expected to be non-negative, instead was ${value}`);

        this.trackCount = value;
    }

    /**
     *
     * @returns {number}
     */
    getTrackCount() {
        return this.trackCount;
    }

    /**
     *
     * @param {number[]} value
     * @param {number[]} positions
     */
    setDefault(value, positions) {
        assert.equal(value.length % this.itemSize, 0, `number(=${value.length}) of elements in the default value set was not multiple of itemSize(=${this.itemSize})`)

        this.defaultTrackValue.itemSize = this.itemSize;
        this.defaultTrackValue.write(value, positions);
    }

    /**
     *
     * @param {number} index
     * @param {ParameterLookupTable} lut
     */
    setTrack(index, lut) {
        if (lut.itemSize !== this.itemSize) {
            throw new Error(`Failed to add parameter track, lut.itemSize(=${lut.itemSize}) does not match patamter.itemSize(=${this.itemSize})`);
        }

        this.tracks.set(index, lut);
    }

    computeStatistics() {
        let i, track;
        let min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY;

        const trackCount = this.trackCount;

        //account defaults
        const defaultTrackValue = this.defaultTrackValue;

        min = min2(min, defaultTrackValue.valueMin);
        max = max2(max, defaultTrackValue.valueMax);

        //account tracks
        for (i = 0; i < trackCount; i++) {
            track = this.tracks.get(i);

            min = min2(min, track.valueMin);
            max = max2(max, track.valueMax);
        }

        //determine common offset and value range
        this.valueMin = min;
        this.valueMax = max;
    }

    build() {
        let i, track;

        //lock default track
        this.defaultTrackValue.disableWriteMode();

        for (i = 0; i < this.trackCount; i++) {
            track = this.tracks.get(i);

            if (track === undefined) {
                //write the default track into the parameter
                this.setTrack(i, this.defaultTrackValue);
            } else {
                //lock track
                track.disableWriteMode();
            }
        }

        this.computeStatistics();
    }

    hash() {
        const tracksHash = this.tracks.hash();

        return computeHashIntegerArray(
            tracksHash,
            computeStringHash(this.name),
            this.itemSize,
            this.trackCount,
            this.defaultTrackValue.hash()
        );
    }

    /**
     *
     * @param {ParticleParameter} other
     * @returns {boolean}
     */
    equals(other) {
        if (this.itemSize !== other.itemSize) {
            return false;
        }

        if (this.name !== other.name) {
            return false;
        }

        if (this.trackCount !== other.trackCount) {
            return false;
        }

        if (!this.defaultTrackValue.equals(other.defaultTrackValue)) {
            return false;
        }

        return this.tracks.equals(other.tracks);
    }
}
