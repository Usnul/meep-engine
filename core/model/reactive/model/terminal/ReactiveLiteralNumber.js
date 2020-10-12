import { ReactiveExpression } from "../ReactiveExpression.js";
import Signal from "../../../../events/signal/Signal.js";
import DataType from "../../../../parser/simple/DataType.js";
import { assert } from "../../../../assert.js";
import { computeHashFloat } from "../../../../math/MathUtils.js";

const dummySignal = new Signal();

export class ReactiveLiteralNumber extends ReactiveExpression {
    /**
     *
     * @param {number} v
     */
    constructor(v) {
        super();

        assert.typeOf(v, "number", 'v');

        //save some ram by using a dummy signal, it never fires anyway since value is constant
        this.onChanged = dummySignal;

        /**
         * @private
         * @readonly
         * @type {number}
         */
        this.value = v;
    }

    /**
     *
     * @param {ReactiveLiteralNumber} other
     */
    copy(other) {
        this.value = other.value;
    }

    /**
     *
     * @return {ReactiveLiteralNumber}
     */
    clone() {
        return new ReactiveLiteralNumber(this.value);
    }

    equals(other) {
        if (other.isReactiveLiteralNumber !== true) {
            return false;
        }

        return this.value === other.value;
    }

    hash() {
        return computeHashFloat(this.value);
    }

    evaluate(scope) {
        return this.value;
    }

    getValue() {
        return this.value;
    }

    toCode() {
        return this.value.toString(10);
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveLiteralNumber.prototype.dataType = DataType.Number;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveLiteralNumber.prototype.isTerminal = true;
/**
 * @readonly
 * @type {boolean}
 */
ReactiveLiteralNumber.prototype.isLiteral = true;


ReactiveLiteralNumber.prototype.isReactiveLiteralNumber = true;

/**
 *
 * @param {number} v
 * @returns {ReactiveLiteralNumber}
 */
ReactiveLiteralNumber.from = function (v) {
    const r = new ReactiveLiteralNumber(v);

    return r;
};
