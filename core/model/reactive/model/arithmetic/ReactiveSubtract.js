import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveSubtract extends ReactiveBinaryExpression {
    /**
     *
     * @param {number} left
     * @param {number} right
     * @returns {number}
     */
    transform(left, right) {
        return left - right;
    }

    /**
     *
     * @return {ReactiveSubtract}
     */
    clone() {
        const r = new ReactiveSubtract();

        r.copy(this);

        return r;
    }
    equals(other) {
        return other.isReactiveSubtract && super.equals(other);
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveSubtract.prototype.dataType = DataType.Number;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveSubtract.prototype.isArithmeticExpression = true;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveSubtract.prototype.isReactiveSubtract = true;


/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveSubtract}
 */
ReactiveSubtract.from = function (left, right) {
    const r = new ReactiveSubtract();

    r.connect(left, right);

    return r;
};
