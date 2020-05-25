import { AbstractArrayIterator } from "./AbstractArrayIterator.js";
import { randomizeArrayElementOrder } from "../ArrayUtils.js";
import { seededRandom } from "../../math/MathUtils.js";

export class ArrayIteratorRandom extends AbstractArrayIterator {
    constructor() {
        super();

        this.__i = 0;
        this.__sequence = [];

        this.__random = seededRandom(0);
    }

    /**
     *
     * @param {number} v
     */
    setSeed(v) {
        this.__random.setCurrentSeed(v);
    }

    initialize(data) {
        super.initialize(data);

        //initialize sequence
        const n = data.length;
        for (let i = 0; i < n; i++) {
            this.__sequence[i] = i;
        }

        randomizeArrayElementOrder(this.__sequence, this.__random);

        this.__i = 0;
    }

    next() {
        const sequence = this.__sequence;
        const data = this.__data;

        const n = sequence.length;

        if (this.__i >= n) {
            return {
                value: undefined,
                done: true
            };
        } else {
            const order = sequence[this.__i];

            const result = {
                value: data[order],
                done: false
            };

            this.__i++;

            return result;
        }

    }
}
