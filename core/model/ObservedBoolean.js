import Signal from '../events/signal/Signal.js';
import { assert } from "../assert.js";

class ObservedBoolean extends Boolean{
    /**
     *
     * @param {boolean} value
     * @constructor
     */
    constructor(value) {
        super();

        assert.equal(typeof value, "boolean", `Value must be of type "boolean", instead was "${typeof value}"`);

        /**
         *
         * @type {Boolean}
         * @private
         */
        this.__value = value;

        this.onChanged = new Signal();
    }

    /**
     *
     * @returns {Boolean}
     */
    valueOf() {
        return this.__value;
    }

    /**
     *
     * @returns {string}
     */
    toString() {
        return this.__value.toString();
    }

    /**
     *
     * @param {Boolean} value
     * @returns {ObservedBoolean}
     */
    set(value) {
        assert.equal(typeof value, "boolean", `Value must be of type "boolean", instead was "${typeof value}"`);

        const oldValue = this.__value;
        if (oldValue !== value) {
            this.__value = value;

            this.onChanged.send2(value, oldValue);
        }

        return this;
    }

    /**
     *
     * @param {ObservedBoolean} other
     */
    copy(other) {
        this.set(other.getValue());
    }

    /**
     *
     * @param {ObservedBoolean} other
     * @returns {boolean}
     */
    equals(other) {
        return this.__value === other.__value;
    }

    /**
     *
     * @return {number}
     */
    hashCode(){
        return this.__value?1:0;
    }

    /**
     *
     * @param {function} f
     */
    process(f) {
        f(this.__value);
        this.onChanged.add(f);
    }

    /**
     *
     * @returns {Boolean}
     */
    getValue() {
        return this.__value;
    }

    /**
     * Flip value. If value is true - it becomes false, if it was false it becomes true
     */
    invert() {
        this.set(!this.__value);
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
        buffer.writeUint8(this.__value ? 1 : 0);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        const v = buffer.readUint8() !== 0;
        this.set(v);
    }
}

ObservedBoolean.FALSE = Object.freeze(new ObservedBoolean(false));
ObservedBoolean.TRUE = Object.freeze(new ObservedBoolean(true));

/**
 * @readonly
 * @type {boolean}
 */
ObservedBoolean.prototype.isObservedBoolean = true;

export default ObservedBoolean;
