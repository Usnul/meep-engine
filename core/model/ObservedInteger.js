import Signal from "../events/signal/Signal.js";
import { assert } from "../assert.js";

class ObservedInteger extends Number {
    /**
     *
     * @param {Number} value
     * @constructor
     */
    constructor(value) {
        super();

        assert.equal(typeof value, "number", `Value must be of type "number", instead was "${typeof value}"`);
        assert.ok(Number.isInteger(value) || !Number.isFinite(value), `Value must be an integer, instead was ${value}`);

        /**
         *
         * @type {Number}
         * @private
         */
        this.__value = value;

        this.onChanged = new Signal();
    }

    /**
     *
     * @returns {Number}
     */
    valueOf() {
        return this.getValue();
    }

    toString() {
        return this.getValue().toString();
    }

    /**
     *
     * @param {Number} value
     * @returns {ObservedInteger}
     */
    set(value) {
        assert.equal(typeof value, "number", `Value must be of type "number", instead was "${typeof value}"`);
        assert.ok(Number.isInteger(value) || !Number.isFinite(value), `Value must be an integer, instead was ${value}`);

        const oldValue = this.__value;
        if (oldValue !== value) {
            this.__value = value;
            this.onChanged.send2(value, oldValue);
        }

        return this;
    }

    /**
     *
     * @return {boolean}
     */
    isZero() {
        return this.getValue() === 0;
    }

    /**
     *
     * @param {ObservedInteger} other
     */
    subtract(other) {
        this._add(-other.getValue());
    }

    /**
     *
     * @param {number} value
     */
    _subtract(value) {
        this.set(this.getValue() - value);
    }

    /**
     *
     * @param {ObservedInteger} other
     */
    add(other) {
        return this._add(other.getValue());
    }

    /**
     *
     * @param {number} value
     * @returns {ObservedInteger}
     */
    _add(value) {
        return this.set(this.getValue() + value);
    }

    /**
     * Increment the stored value by 1, same as adding 1
     */
    increment() {
        this.set(this.getValue() + 1);
    }

    /**
     * Decrement the stored value by 1, same as subtracting 1
     */
    decrement() {
        this.set(this.getValue() - 1);
    }

    /**
     *
     * @returns {Number}
     */
    getValue() {
        return this.__value;
    }

    /**
     *
     * @param {ObservedInteger} other
     */
    copy(other) {
        this.set(other.__value);
    }

    /**
     *
     * @param {ObservedInteger} other
     * @returns {boolean}
     */
    equals(other) {
        return this.__value === other.__value;
    }

    /**
     *
     * @returns {Number}
     */
    hash() {
        return this.__value;
    }

    toJSON() {
        return this.__value;
    }

    fromJSON(obj) {
        this.set(obj);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    toBinaryBuffer(buffer) {
        const v = this.__value;

        if (v === Infinity) {
            buffer.writeInt32(2147483647);
        } else if (v === -Infinity) {
            buffer.writeInt32(-2147483648);
        } else {
            //TODO it's possible to write encoded Infinity values by accident
            buffer.writeInt32(v);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        const value = buffer.readInt32();

        if (value === 2147483647) {
            this.set(Infinity);
        } else if (value === -2147483648) {
            this.set(-Infinity);
        } else {
            this.set(value);
        }
    }
}


/**
 * @readonly
 * @type {boolean}
 */
ObservedInteger.prototype.isObservedInteger = true;

export default ObservedInteger;
