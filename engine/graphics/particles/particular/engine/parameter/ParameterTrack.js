/**
 *
 * @param {string} name
 * @param {ParameterLookupTable} lut
 * @constructor
 */
import { ParameterLookupTable } from "./ParameterLookupTable.js";
import { computeHashIntegerArray } from "../../../../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../../../../core/primitives/strings/StringUtils.js";

export class ParameterTrack {
    constructor(name, lut) {
        /**
         *
         * @type {string}
         */
        this.name = name;
        /**
         *
         * @type {ParameterLookupTable}
         */
        this.track = lut;
    }

    toJSON() {
        return {
            name: this.name,
            track: this.track.toJSON()
        };
    }

    fromJSON(json) {
        this.name = json.name;

        const track = new ParameterLookupTable();
        track.fromJSON(json.track);

        this.track = track
    }

    /**
     * @deprecated use serialization adapters instead
     * @param {BinaryBuffer} buffer
     */
    toBinaryBuffer(buffer) {
        buffer.writeUTF8String(this.name);
        this.track.toBinaryBuffer(buffer);
    }

    /**
     * @deprecated use serialization adapters instead
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        this.name = buffer.readUTF8String();

        this.track = new ParameterLookupTable();

        this.track.fromBinaryBuffer(buffer);
    }

    hash() {
        return computeHashIntegerArray(
            computeStringHash(this.name),
            this.track.hash()
        );
    }

    /**
     *
     * @param {ParameterTrack} other
     * @returns {boolean}
     */
    equals(other) {
        return this.name === other.name && this.track.equals(other.track);
    }
}
