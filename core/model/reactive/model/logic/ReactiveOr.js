import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveOr extends ReactiveBinaryExpression {
    /**
     *
     * @param {boolean} left
     * @param {boolean} right
     * @returns {boolean}
     */
    transform(left, right) {
        return left || right;
    }

    /**
     *
     * @return {ReactiveOr}
     */
    clone() {
        const r = new ReactiveOr();

        r.copy(this);

        return r;
    }

    evaluate(scope) {
        const left = this.left.evaluate(scope);

        if (left) {
            return true;
        }

        return this.right.evaluate(scope);
    }

    equals(other) {
        return other.isReactiveOr && super.equals(other);
    }

    toCode() {
        return `( ${this.left.toCode()} || ${this.right.toCode()} )`
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveOr.prototype.dataType = DataType.Boolean;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveOr.prototype.isLogicExpression = true;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveOr.prototype.isReactiveOr = true;

ReactiveOr.prototype.isCommutative = true;

/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveOr}
 */
ReactiveOr.from = function (left, right) {
    const r = new ReactiveOr();

    r.connect(left, right);

    return r;
};
