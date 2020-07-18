import { binarySearchLowIndex } from "../ArrayUtils.js";
import List from "./List.js";

export class SortedListProjection {
    /**
     *
     * @param {List<T>} input
     * @param {function(T,T):number} comparator
     */
    constructor(input, comparator) {
        /**
         *
         * @type {List<T>}
         */
        this.input = input;

        /**
         *
         * @type {List<T>}
         */
        this.output = new List();

        /**
         *
         * @type {function(T, T): number}
         */
        this.comparator = comparator;
    }

    link() {
        this.input.on.added.add(this.handleAddition, this);

        this.build();
    }

    unlink() {
        this.input.on.added.remove(this.handleAddition, this);
    }

    /**
     *
     * @param {T} el
     */
    handleAddition(el) {
        const where = binarySearchLowIndex(this.output.data, el, this.comparator);

        this.output.insert(where, el);
    }


    build() {
        this.output.reset();

        const n = this.input.length;

        for (let i = 0; i < n; i++) {
            const t = this.input.get(i);

            this.handleAddition(t);
        }
    }

}
