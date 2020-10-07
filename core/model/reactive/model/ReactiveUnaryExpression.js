import { ReactiveExpression } from "./ReactiveExpression.js";
import { assert } from "../../../assert.js";
import { computeStringHash } from "../../../primitives/strings/StringUtils.js";

/**
 * @template T,R
 */
export class ReactiveUnaryExpression extends ReactiveExpression {
    constructor() {
        super();

        /**
         *
         * @type {ReactiveExpression<T>}
         */
        this.source = null;

    }

    copy(other) {
        this.disconnect();

        if (other.source !== null) {
            this.connect(other.source.clone());
        }
    }

    update(v) {
        const result = this.transform(v);

        this.onChanged.dispatch(result);
    }

    traverse(visitor, thisArg) {
        super.traverse(visitor, thisArg);

        this.source.traverse(visitor);
    }

    connect(source) {
        assert.equal(this.source, null, 'source is already set');

        this.source = source;

        this.source.onChanged.add(this.update, this);
    }

    disconnect() {
        this.source.onChanged.remove(this.update, this);

        this.source = null;
    }

    /**
     * @protected
     */
    transform(v) {
        throw new Error('ReactiveUnaryExpression.transform is not overridden');
    }

    evaluate(scope) {
        const source_value = this.source.evaluate(scope);

        return transform(source_value);
    }

    /**
     *
     * @param {ReactiveExpression} other
     * @returns {boolean}
     */
    equals(other) {
        return other.isUnaryExpression
            && this.source.equals(other.source)
            && super.equals(other)
            ;
    }

    /**
     *
     * @returns {number}
     */
    hash() {
        return computeStringHash(this.dataType);
    }

    getValue() {
        return this.transform(this.source.getValue());
    }
}

ReactiveUnaryExpression.prototype.isUnaryExpression = true;
