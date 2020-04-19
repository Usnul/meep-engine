import { ReactiveExpression } from "./ReactiveExpression.js";
import { assert } from "../../../assert.js";

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

    getValue() {
        return this.transform(this.source.getValue());
    }
}

ReactiveUnaryExpression.prototype.isUnaryExpression = true;
