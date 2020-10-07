import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveLessThanOrEqual extends ReactiveBinaryExpression {
    /**
     *
     * @param {number} left
     * @param {number} right
     * @returns {boolean}
     */
    transform(left, right) {
        return left <= right;
    }

    /**
     *
     * @return {ReactiveLessThanOrEqual}
     */
    clone() {
        const r = new ReactiveLessThanOrEqual();

        r.copy(this);

        return r;
    }
    equals(other) {
        return other.isReactiveLessThanOrEqual && super.equals(other);
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveLessThanOrEqual.prototype.dataType = DataType.Boolean;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveLessThanOrEqual.prototype.isComparativeExpression = true;
ReactiveLessThanOrEqual.prototype.isReactiveLessThanOrEqual = true;

/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveLessThanOrEqual}
 */
ReactiveLessThanOrEqual.from = function (left, right) {
    const r = new ReactiveLessThanOrEqual();

    r.connect(left, right);

    return r;
};
