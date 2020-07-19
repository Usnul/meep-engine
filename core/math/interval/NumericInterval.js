/**
 *
 * @param {number} min
 * @param {number} max
 * @constructor
 */
import { assert } from "../../assert.js";
import Signal from "../../events/signal/Signal.js";
import { computeHashFloat, inverseLerp } from "../MathUtils.js";

export class NumericInterval {
    /**
     *
     * @param {number} [min=-Infinity]
     * @param {number} [max=Infinity]
     * @constructor
     */
    constructor(
        min = Number.NEGATIVE_INFINITY,
        max = Number.POSITIVE_INFINITY
    ) {
        assert.isNumber(min, 'min');
        assert.isNumber(max, 'max');

        assert.ok(max >= min, `max=${max} must be >= than min=${min}`);

        /**
         *
         * @type {number}
         */
        this.min = min;
        /**
         *
         * @type {number}
         */
        this.max = max;

        this.onChanged = new Signal();
    }

    /**
     *
     * @param {number} min
     * @param {number} max
     */
    set(min, max) {
        assert.isNumber(min, 'min');
        assert.isNumber(max, 'max');

        assert.ok(max >= min, `max(${max}) must be >= than min(${min})`);

        const oldMin = this.min;
        const oldMax = this.max;

        if (min !== oldMin || max !== oldMax) {
            this.min = min;
            this.max = max;

            if (this.onChanged.hasHandlers()) {
                this.onChanged.dispatch(min, max, oldMin, oldMax);
            }
        }
    }

    /**
     *
     * @param {NumericInterval} other
     */
    copy(other) {
        this.set(other.min, other.max);
    }

    /**
     *
     * @param {number} value
     */
    multiplyScalar(value) {
        const v0 = this.min * value;
        const v1 = this.max * value;

        if (v0 > v1) {
            //probably negative scale
            this.set(v1, v0);
        } else {

            this.set(v0, v1);
        }
    }

    /**
     * Performs inverse linear interpolation on a given input
     * @param {number} v
     * @returns {number}
     */
    normalizeValue(v) {
        return inverseLerp(this.min, this.max, v);
    }

    /**
     * Both min and max are exactly 0
     * @returns {boolean}
     */
    isZero() {
        return this.min === 0 && this.max === 0;
    }

    /**
     *
     * @returns {number}
     */
    computeAverage() {
        return (this.min + this.max) / 2;
    }

    /**
     *
     * @param {function} random Random number generator function, must return values between 0 and 1
     * @returns {number}
     */
    sampleRandom(random) {
        assert.equal(typeof random, 'function', `random must be a function, instead was ${typeof random}`);

        return this.min + random() * (this.max - this.min);
    }

    fromJSON(json) {
        this.set(json.min, json.max);
    }

    toJSON() {
        return {
            min: this.min,
            max: this.max
        };
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    toBinaryBuffer(buffer) {
        buffer.writeFloat64(this.min);
        buffer.writeFloat64(this.max);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        this.min = buffer.readFloat64();
        this.max = buffer.readFloat64();
    }

    /**
     *
     * @param {NumericInterval} other
     * @returns {boolean}
     */
    equals(other) {
        return this.min === other.min && this.max === other.max;
    }

    /**
     *
     * @returns {number}
     */
    hash() {
        let hash = computeHashFloat(this.min);

        hash = ((hash << 5) - hash) + computeHashFloat(this.max);

        return hash;
    }
}

/**
 * @readonly
 * @type {boolean}
 */
NumericInterval.prototype.isNumericInterval = true;

/**
 * @readonly
 * @type {NumericInterval}
 */
NumericInterval.one_one = Object.freeze(new NumericInterval(1, 1));
/**
 * @readonly
 * @type {NumericInterval}
 */
NumericInterval.zero_zero = Object.freeze(new NumericInterval(0, 0));

