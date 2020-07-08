/**
 * Created by Alex on 29/06/2017.
 */


import Signal from '../events/signal/Signal.js';
import { strictEquals } from "../function/Functions.js";

/**
 * Structure with event signals for observing changes.
 */
class Set {
    /**
     *
     * @param {Array.<T>} [array=[]]
     * @template T
     * @constructor
     * @property {{added: Signal, removed: Signal}} on
     */
    constructor(array) {
        this.on = {
            added: new Signal(),
            removed: new Signal()
        };

        /**
         *
         * @type {T[]}
         */
        this.data = [];

        this.length = 0;

        if (array !== undefined) {
            this.addAll(array);
        }
    }

    /**
     *
     * @param {T} el
     */
    contains(el) {
        return this.data.indexOf(el) !== -1;
    }

    /**
     *
     * @param {T} el
     */
    add(el) {
        if (!this.contains(el)) {
            this.data.push(el);
            this.length++;
            this.on.added.dispatch(el);

            return true;
        } else {
            //element already exists
            return false;
        }
    }

    /**
     *
     * @param {T} el
     */
    remove(el) {
        const index = this.data.indexOf(el);

        if (index !== -1) {
            this.__removeByIndex(index, el);

            return true;
        } else {
            //element not found
            return false;
        }
    }

    /**
     *
     * @param {Number} index
     * @param {T} el
     * @private
     */
    __removeByIndex(index, el) {
        this.data.splice(index, 1);
        this.length--;
        this.on.removed.dispatch(el);
    }

    /**
     *
     * @returns {boolean}
     */
    isEmpty() {
        return this.length <= 0;
    }

    /**
     * Remove all elements from the set
     */
    clear() {
        while (!this.isEmpty()) {
            this.remove(this.data[0]);
        }
    }

    /**
     *
     * @param {Array.<T>} elements
     */
    addAll(elements) {
        for (let i = 0, l = elements.length; i < l; i++) {
            this.add(elements[i]);
        }
    }

    /**
     * Performs a diff on the set and provided collection, elements in the set but not in input are removed and elements in the input but not in the set are added.
     * @param {Array.<T>} source
     */
    setFromArray(source) {
        const data = this.data;

        const sourceCopy = source.slice();

        for (let i = data.length - 1; i >= 0; i--) {
            const element = data[i];
            const sourceIndex = sourceCopy.indexOf(element);
            if (sourceIndex === -1) {
                //element is in the set currently, but not in the collection which we are trying to copy
                this.__removeByIndex(i, element);
            } else {
                //source element is already in the set
                sourceCopy.splice(sourceIndex, 1);
            }
        }

        //add the rest to selection
        for (let i = 0, l = sourceCopy.length; i < l; i++) {
            this.add(sourceCopy[i]);
        }
    }

    /**
     *
     * @param {function(el:T)} visitor
     */
    forEach(visitor) {
        for (let i = 0; i < this.length; i++) {
            visitor(this.data[i]);
        }
    }

    /**
     *
     * @returns {T[]}
     */
    asArray() {
        return this.data;
    }
}


/**
 * @template T
 * @param {T[]} array
 * @param {T} element
 * @param {function(a:T,b:T):boolean} equals
 * @returns {number}
 */
export function arrayIndexByEquality(array, element, equals) {
    const n = array.length;

    for (let i = 0; i < n; i++) {
        const el = array[i];

        if (equals(element, el)) {
            return i;
        }
    }

    return -1;
}

/**
 * @template T
 * @param {T[]} a
 * @param {T[]} b
 * @param {function(a:T,b:T):boolean} [equals]
 * @returns {{uniqueA:T[], uniqueB:T[], common:T[]}}
 */
export function arraySetDiff(a, b, equals = strictEquals) {
    const uniqueA = a.slice();
    const uniqueB = b.slice();

    const common = [];

    let lA = uniqueA.length;

    let i;
    for (i = 0; i < lA; i++) {
        const elA = uniqueA[i];

        const j = arrayIndexByEquality(uniqueB, elA, equals);

        if (j !== -1) {
            common.push(elA);

            uniqueA.splice(i, 1);
            uniqueB.splice(j, 1);

            i--;
            lA--;
        }
    }

    return {
        uniqueA,
        uniqueB,
        common
    };
}

export default Set;
