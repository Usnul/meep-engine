import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveLessThan extends ReactiveBinaryExpression {
    /**
     *
     * @param {number} left
     * @param {number} right
     * @returns {boolean}
     */
    transform(left, right) {
        return left < right;
    }

    /**
     *
     * @return {ReactiveLessThan}
     */
    clone() {
        const r = new ReactiveLessThan();

        r.copy(this);

        return r;
    }
    equals(other) {
        return other.isReactiveLessThan && super.equals(other);
    }
    toCode() {
        return `( ${this.left.toCode()} < ${this.right.toCode()} )`
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveLessThan.prototype.dataType = DataType.Boolean;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveLessThan.prototype.isComparativeExpression = true;

ReactiveLessThan.prototype.isReactiveLessThan = true;

/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveLessThan}
 */
ReactiveLessThan.from = function (left, right) {
    const r = new ReactiveLessThan();

    r.connect(left, right);

    return r;
};
