import { ReactiveExpression } from "../ReactiveExpression.js";
import DataType from "../../../../parser/simple/DataType.js";
import { assert } from "../../../../assert.js";
import Signal from "../../../../events/signal/Signal.js";

const dummySignal = new Signal();

export class ReactiveLiteralString extends ReactiveExpression {
    constructor(v = '') {
        super();

        assert.typeOf(v, "string", 'v');

        //save some ram by using a dummy signal, it never fires anyway since value is constant
        this.onChanged = dummySignal;

        this.value = v;
    }

    copy(other) {
        this.value = other.value;
    }

    clone() {
        return new ReactiveLiteralString(this.value);
    }

    getValue() {
        return this.value;
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveLiteralString.prototype.dataType = DataType.String;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveLiteralString.prototype.isTerminal = true;

/**
 *
 * @type {boolean}
 */
ReactiveLiteralString.prototype.isReactiveLiteralString = true;

/**
 *
 * @param {string} v
 * @returns {ReactiveLiteralString}
 */
ReactiveLiteralString.from = function (v) {
    const r = new ReactiveLiteralString(v);

    return r;
};
