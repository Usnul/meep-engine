import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveDivide extends ReactiveBinaryExpression {
    /**
     *
     * @param {number} left
     * @param {number} right
     * @returns {number}
     */
    transform(left, right) {
        return left / right;
    }

    /**
     *
     * @return {ReactiveDivide}
     */
    clone() {
        const r = new ReactiveDivide();

        r.copy(this);

        return r;
    }
    equals(other) {
        return other.isReactiveDivide && super.equals(other);
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveDivide.prototype.dataType = DataType.Number;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveDivide.prototype.isArithmeticExpression = true;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveDivide.prototype.isReactiveDivide = true;

/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveDivide}
 */
ReactiveDivide.from = function (left, right) {
    const r = new ReactiveDivide();

    r.connect(left, right);

    return r;
};
