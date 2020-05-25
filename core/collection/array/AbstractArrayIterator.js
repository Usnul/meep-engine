/**
 * @template T
 */
export class AbstractArrayIterator {
    /**
     *
     * @param {T[]} data
     */
    initialize(data) {
        /**
         *
         * @type {T[]}
         * @protected
         */
        this.__data = data;
    }

    /**
     * @returns {{value:T, done:boolean}}
     */
    next() {

    }
}
