import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveGreaterThan extends ReactiveBinaryExpression {
    /**
     *
     * @param {number} left
     * @param {number} right
     * @returns {boolean}
     */
    transform(left, right) {
        return left > right;
    }

    /**
     *
     * @return {ReactiveGreaterThan}
     */
    clone() {
        const r = new ReactiveGreaterThan();

        r.copy(this);

        return r;
    }
    equals(other) {
        return other.isReactiveGreaterThan && super.equals(other);
    }
    toCode() {
        return `( ${this.left.toCode()} > ${this.right.toCode()} )`
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveGreaterThan.prototype.dataType = DataType.Boolean;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveGreaterThan.prototype.isComparativeExpression = true;

/**
 *
 * @type {boolean}
 */
ReactiveGreaterThan.prototype.isReactiveGreaterThan = true;

/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveGreaterThan}
 */
ReactiveGreaterThan.from = function (left, right) {
    const r = new ReactiveGreaterThan();

    r.connect(left, right);

    return r;
};
