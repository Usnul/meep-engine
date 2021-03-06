import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveAdd extends ReactiveBinaryExpression {
    /**
     *
     * @param {number} left
     * @param {number} right
     * @returns {number}
     */
    transform(left, right) {
        return left + right;
    }

    /**
     *
     * @return {ReactiveAdd}
     */
    clone() {
        const r = new ReactiveAdd();

        r.copy(this);

        return r;
    }

    equals(other) {
        return other.isReactiveAdd && super.equals(other);
    }

    toCode() {
        return `( ${this.left.toCode()} + ${this.right.toCode()} )`
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveAdd.prototype.dataType = DataType.Number;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveAdd.prototype.isArithmeticExpression = true;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveAdd.prototype.isReactiveAdd = true;

ReactiveAdd.prototype.isCommutative = true;

/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveAdd}
 */
ReactiveAdd.from = function (left, right) {
    const r = new ReactiveAdd();

    r.connect(left, right);

    return r;
};
