import Signal from "../../../../events/signal/Signal.js";
import { ReactiveExpression } from "../ReactiveExpression.js";
import DataType from "../../../../parser/simple/DataType.js";
import { assert } from "../../../../assert.js";

const dummySignal = new Signal();

export class ReactiveLiteralBoolean extends ReactiveExpression {
    /**
     *
     * @param {boolean} v
     */
    constructor(v) {
        super();

        assert.typeOf(v, "boolean", 'v');

        //save some ram by using a dummy signal, it never fires anyway since value is constant
        this.onChanged = dummySignal;

        /**
         * @private
         * @readonly
         * @type {boolean}
         */
        this.value = v;
    }


    /**
     *
     * @param {ReactiveLiteralBoolean} other
     */
    copy(other) {
        this.value = other.value;
    }

    /**
     *
     * @return {ReactiveLiteralBoolean}
     */
    clone() {
        return new ReactiveLiteralBoolean(this.value);
    }

    equals(other) {

        if (other.isReactiveLiteralBoolean !== true) {
            return false;
        }

        return this.value === other.value;
    }

    hash() {
        return this.value ? 1 : 0;
    }

    evaluate(scope) {
        return this.value;
    }

    getValue() {
        return this.value;
    }

    toCode() {
        return this.value ? "true" : "false";
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveLiteralBoolean.prototype.dataType = DataType.Boolean;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveLiteralBoolean.prototype.isTerminal = true;
/**
 * @readonly
 * @type {boolean}
 */
ReactiveLiteralBoolean.prototype.isLiteral = true;


ReactiveLiteralBoolean.prototype.isReactiveLiteralBoolean = true;

/**
 *
 * @param {boolean} v
 * @returns {ReactiveLiteralBoolean}
 */
ReactiveLiteralBoolean.from = function (v) {
    const r = new ReactiveLiteralBoolean(v);

    return r;
};
