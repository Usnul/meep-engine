import Signal from "../../../events/signal/Signal.js";
import DataType from "../../../parser/simple/DataType.js";
import { computeStringHash } from "../../../primitives/strings/StringUtils.js";

/**
 * @template T
 */
export class ReactiveExpression {
    constructor() {
        this.onChanged = new Signal();
    }

    copy(other) {
        throw new Error('Not Implemented');
    }

    clone() {
        throw new Error('Not Implemented');
    }

    /**
     *
     * @param {ReactiveExpression} other
     * @returns {boolean}
     */
    equals(other) {
        if (this.dataType !== other.dataType) {
            return false;
        }

        return true;
    }

    /**
     *
     * @returns {string}
     */
    toCode() {
        return "";
    }
    /**
     *
     * @returns {number}
     */
    hash() {
        return computeStringHash(this.dataType);
    }

    /**
     * @returns {T|boolean|number}
     */
    getValue() {
        throw new Error('ReactiveExpression.getValue not overridden');
    }

    /**
     *
     * @param {function(node:ReactiveExpression)} visitor
     * @param {*} [thisArg]
     */
    traverse(visitor, thisArg) {
        visitor.call(thisArg, this);
    }

    /**
     *
     * @param {function} handler
     */
    process(handler) {
        handler(this.getValue());

        this.onChanged.add(handler);
    }

    /**
     *
     * @param {Object} scope
     * @returns {boolean|number|string}
     */
    evaluate(scope) {
        return 0;
    }
}

ReactiveExpression.prototype.dataType = DataType.Any;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveExpression.prototype.isReactiveExpression = true;
