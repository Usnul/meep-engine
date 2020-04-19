import { ReactiveUnaryExpression } from "../ReactiveUnaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveNegate extends ReactiveUnaryExpression {
    /**
     *
     * @param {number} v
     * @returns {number}
     */
    transform(v) {
        return -v;
    }

    /**
     *
     * @return {ReactiveNegate}
     */
    clone() {
        const r = new ReactiveNegate();

        r.copy(this);

        return r;
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveNegate.prototype.dataType = DataType.Number;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveNegate.prototype.isArithmeticExpression = true;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveNegate.prototype.isReactiveNegate = true;


/**
 *
 * @param {ReactiveExpression} source
 * @returns {ReactiveNegate}
 */
ReactiveNegate.from = function (source) {
    const r = new ReactiveNegate();

    r.connect(source);

    return r;
};
