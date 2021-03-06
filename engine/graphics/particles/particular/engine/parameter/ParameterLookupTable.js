import { isTypedArray } from "../../../../../../core/json/JsonUtils.js";
import {
    computeHashFloatArray,
    computeHashIntegerArray,
    inverseLerp,
    max2,
    min2,
    mix
} from "../../../../../../core/math/MathUtils.js";
import { assert } from "../../../../../../core/assert.js";
import { ParameterLookupTableFlags } from "./ParameterLookupTableFlags.js";
import { ParameterLookupTableSerializationAdapter } from "../emitter/serde/ParameterLookupTableSerializationAdapter.js";


export class ParameterLookupTable {
    /**
     *
     * @param {number} itemSize
     * @constructor
     */
    constructor(itemSize) {
        this.itemSize = itemSize;
        this.data = [];
        this.positions = [];


        /**
         * Transient value
         * @type {number}
         */
        this.valueMin = 0;

        /**
         * Transient value
         * @type {number}
         */
        this.valueMax = 0;

        /**
         *
         * @type {number}
         */
        this.flags = 1;
    }

    /**
     *
     * @param {ParameterLookupTableFlags} f
     */
    setFlag(f) {
        this.flags |= f;
    }

    /**
     *
     * @param {ParameterLookupTableFlags|number} f
     */
    clearFlag(f) {
        this.flags &= ~f;
    }

    /**
     *
     * @param {ParameterLookupTableFlags} f
     * @returns {boolean}
     */
    getFlag(f) {
        return (this.flags & f) !== 0;
    }

    disableWriteMode() {
        this.clearFlag(ParameterLookupTableFlags.WriteMode);
    }

    fromJSON(json) {
        this.itemSize = json.itemSize;
        this.write(json.data, json.positions);
    }

    toJSON() {
        return {
            itemSize: this.itemSize,
            data: Array.from(this.data),
            positions: Array.from(this.positions)
        };
    }

    /**
     *
     * @deprecated Use serialization adapter instead
     * @param {BinaryBuffer} buffer
     */
    toBinaryBuffer(buffer) {
        const adapter = new ParameterLookupTableSerializationAdapter();

        adapter.serialize(buffer, this);
    }

    /**
     * @deprecated Use serialization adapter instead
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        const adapter = new ParameterLookupTableSerializationAdapter();

        adapter.deserialize(buffer, this);
    }

    /**
     *
     * @param {number} position
     * @param {number[]} result
     */
    sample(position, result) {
        assert.equal(typeof position, 'number', `position expected to be a number, instead was '${typeof position}'`);
        assert.ok(position >= 0 && position <= 1, `position must be between 0 and 1, instead was ${position}`);

        const itemSize = this.itemSize;
        const numValues = this.data.length / itemSize;

        let i;

        const positions = this.positions;

        let lowIndex = numValues - 1;
        let highIndex = lowIndex;
        let fraction = 0;

        //find position index
        for (i = 0; i < numValues; i++) {
            //NOTE: no complex search is used, since for small data sizes linear scan is typically faster
            const p = positions[i];

            if (p === position) {
                lowIndex = i;
                highIndex = i;
                fraction = 0;
                break;
            } else if (p > position) {
                highIndex = i;
                if (i === 0) {
                    lowIndex = i;
                    fraction = 0;
                } else {
                    lowIndex = i - 1;
                    const prevPosition = positions[lowIndex];
                    fraction = inverseLerp(prevPosition, p, position);
                }
                break;
            }
        }


        for (i = 0; i < itemSize; i++) {
            const lowValue = this.data[lowIndex * itemSize + i];
            const highValue = this.data[highIndex * itemSize + i];

            const value = mix(lowValue, highValue, fraction);

            result[i] = value;
        }
    }

    computeUniformPositions() {
        const numValues = this.data.length / this.itemSize;

        const positions = [];

        this.positions = positions;

        for (let i = 0; i < numValues; i++) {
            positions[i] = i / (numValues - 1);
        }
    }

    /**
     *
     * @param {number[]|Float64Array|Float32Array} values
     * @param {number[]|Float64Array|Float32Array} [positions]
     */
    write(values, positions) {
        if (!this.getFlag(ParameterLookupTableFlags.WriteMode)) {
            throw new Error(`Cannot write, WriteMode disabled`);
        }

        assert.ok(Array.isArray(values) || isTypedArray(values), `values argument must be an array or a typed array, but was something else instead`);

        const numValues = values.length;

        assert.equal(numValues % this.itemSize, 0, `number of elements in the array(=${numValues}) is not multiple of itemSize(=${this.itemSize})`);

        this.data = values;

        if (positions === undefined) {

            console.warn('positions are undefined, assuming uniform distribution');
            this.computeUniformPositions();

        } else {

            assert.equal(numValues / this.itemSize, positions.length, `number of positions(=${positions.length}) is not equal to number of values(=${numValues / this.itemSize})`);

            this.positions = positions;
        }

        this.computeStatistics();
    }

    /**
     *
     * @param {number} position
     * @param {number[]} value
     */
    addValue(position, value) {
        if (!this.getFlag(ParameterLookupTableFlags.WriteMode)) {
            throw new Error(`Cannot add value, WriteMode disabled`);
        }

        //insert operation cannot be done on a TypedArray, so we need to make sure we are working with dynamic array
        if (!Array.isArray(this.positions)) {
            this.positions = Array.from(this.positions);
        }

        if (!Array.isArray(this.data)) {
            this.data = Array.from(this.data);
        }

        //find a place to insert the value at
        const positions = this.positions;
        const numValues = positions.length;

        let i;

        for (i = 0; i < numValues; i++) {
            const p = positions[i];
            if (p > position) {
                break;
            }
        }


        //insert value
        positions.splice(i, 0, position);

        const spliceArgs = value.slice();
        spliceArgs.unshift(i * this.itemSize, 0);

        Array.prototype.splice.apply(this.data, spliceArgs);
    }

    /**
     * Populates statistics values
     */
    computeStatistics() {
        //first find min and max values
        let min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY;


        const numElements = this.data.length;

        let i;

        for (i = 0; i < numElements; i++) {
            const inputElement = this.data[i];

            min = min2(min, inputElement);
            max = max2(max, inputElement);
        }

        this.valueMin = min;
        this.valueMax = max;
    }

    hash() {
        const valueMax = this.valueMax;
        const valueMin = this.valueMin;
        if (valueMin === valueMax) {
            //special case, all values are the same
            return computeHashIntegerArray(valueMin);
        } else {
            const dataHash = computeHashFloatArray(this.data, valueMin, valueMax);
            const positionHash = computeHashFloatArray(this.positions, 0, 1);

            return computeHashIntegerArray(dataHash, positionHash, this.itemSize);
        }
    }

    /**
     *
     * @param {ParameterLookupTable} other
     * @returns {boolean}
     */
    equals(other) {
        if (this.itemSize !== other.itemSize) {
            return false;
        }

        const thisData = this.data;
        const otherData = other.data;

        const thisDataLength = thisData.length;
        const otherDataLength = otherData.length;

        if (thisDataLength !== otherDataLength) {
            return false;
        }

        const thisPositions = this.positions;
        const otherPositions = other.positions;

        const thisPositionsLength = thisPositions.length;
        const otherPositionsLength = otherPositions.length;

        if (thisPositionsLength !== otherPositionsLength) {
            return false;
        }

        let i;

        for (i = 0; i < thisPositionsLength; i++) {
            const pA = thisPositions[i];
            const pB = otherPositions[i];

            if (pA !== pB) {
                return false;
            }
        }

        for (i = 0; i < thisDataLength; i++) {
            const dA = thisData[i];
            const dB = otherData[i];

            if (dA !== dB) {
                return false;
            }
        }

        //equal
        return true;
    }

    validate() {
        //check data size
        const data = this.data;
        const dataLength = data.length;

        const positions = this.positions;
        const positionLength = positions.length;

        if ((dataLength / this.itemSize) !== positionLength) {
            //number of samples between position and data doesn't match
            return false;
        }


        //check position values
        let i, prevPosition;

        for (i = 0; i < positionLength; i++) {
            const position = positions[i];

            if (position < 0) {
                //position value must be greater or equal to 0
                return false;
            }

            if (position > 1) {
                //position must be less than or equal to 1
                return false;
            }

            if (prevPosition !== undefined) {
                if (position <= prevPosition) {
                    //position values must always increase
                    return false;
                }
            }

            prevPosition = position;
        }

        //all is good
        return true;
    }

    /**
     *
     * @param {number} itemSize
     * @param {number[]} values
     * @param {number[]} [positions]
     */
    static from(itemSize, values, positions) {
        const r = new ParameterLookupTable(itemSize);

        r.write(values, positions)

        return r;
    }
}

/**
 * @readonly
 * @type {boolean}
 */
ParameterLookupTable.prototype.isParameterLookupTable = true;
