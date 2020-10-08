import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveAnd extends ReactiveBinaryExpression {
    /**
     *
     * @param {boolean} left
     * @param {boolean} right
     * @returns {boolean}
     */
    transform(left, right) {
        return left && right;
    }

    /**
     *
     * @return {ReactiveAnd}
     */
    clone() {
        const r = new ReactiveAnd();

        r.copy(this);

        return r;
    }

    evaluate(scope) {
        const left = this.left.evaluate(scope);

        if (!left) {
            return false;
        }

        return this.right.evaluate(scope);
    }

    equals(other) {
        return other.isReactiveAnd && super.equals(other);
    }

    toCode() {
        return `( ${this.left.toCode()} && ${this.right.toCode()} )`
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveAnd.prototype.dataType = DataType.Boolean;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveAnd.prototype.isLogicExpression = true;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveAnd.prototype.isReactiveAnd = true;

ReactiveAnd.prototype.isCommutative = true;

/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveAnd}
 */
ReactiveAnd.from = function (left, right) {
    const r = new ReactiveAnd();

    r.connect(left, right);

    return r;
};
