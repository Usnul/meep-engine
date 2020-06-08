import { ReactiveExpression } from "./ReactiveExpression.js";
import { assert } from "../../../assert.js";

/**
 * @extends {ReactiveExpression}
 */
export class ReactiveBinaryExpression extends ReactiveExpression {
    constructor() {
        super();

        /**
         *
         * @type {ReactiveExpression|null}
         */
        this.left = null;
        /**
         *
         * @type {ReactiveExpression|null}
         */
        this.right = null;

        /**
         *
         * @type {undefined}
         * @private
         */
        this.__oldValue = undefined;

    }

    copy(other) {
        assert.equal(other.isReactiveExpression, true, 'other.isReactiveExpression !== true');

        this.disconnect();

        if (other.left !== null && other.right !== null) {
            this.connect(other.left.clone(), other.right.clone());
        }
    }

    update() {
        const result = this.getValue();

        if (result === this.__oldValue) {
            return;
        }

        this.onChanged.dispatch(result);

        this.__oldValue = result;
    }

    /**
     *
     * @returns {T|boolean|number}
     */
    transform(left, right) {
        throw new Error('ReactiveBinaryExpression.transform is not overridden');
    }

    traverse(visitor, thisArg) {
        super.traverse(visitor, thisArg);

        this.left.traverse(visitor);
        this.right.traverse(visitor);
    }

    /**
     *
     * @param left
     * @param right
     */
    connect(left, right) {
        assert.notEqual(left, undefined, 'left is undefined');
        assert.notEqual(left, null, 'left is null');

        assert.notEqual(right, undefined, 'right is undefined');
        assert.notEqual(right, null, 'right is null');

        assert.notEqual(left.onChanged, undefined, 'left.onChanged is undefined');
        assert.notEqual(right.onChanged, undefined, 'right.onChanged is undefined');

        this.left = left;
        this.right = right;

        left.onChanged.add(this.update, this);
        right.onChanged.add(this.update, this);

        //reset the old value
        this.__oldValue = undefined;
    }

    disconnect() {
        if (this.left !== null) {

            this.left.onChanged.remove(this.update, this);
            this.left = null;

        }

        if (this.right !== null) {
            this.right.onChanged.remove(this.update, this);

            this.right = null;
        }
    }

    getValue() {

        const left = this.left;

        if (left === null) {
            //not linked
            throw new Error('left is null');
        }

        const right = this.right;

        if (right === null) {
            //not linked
            throw new Error('right is null');
        }

        const leftValue = left.getValue();
        const rightValue = right.getValue();

        return this.transform(leftValue, rightValue);
    }
}

/**
 * @readonly
 * @type {boolean}
 */
ReactiveBinaryExpression.prototype.isBinaryExpression = true;
