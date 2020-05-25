import { AbstractArrayIterator } from "./AbstractArrayIterator.js";

export class ArrayIteratorSequential extends AbstractArrayIterator {
    constructor() {
        super();

        this.__i = 0;
    }

    initialize(data) {
        super.initialize(data);

        this.__i = 0;
    }

    next() {
        const data = this.__data;

        const length = data.length;

        if (this.__i >= length) {
            return {
                value: undefined,
                done: true
            }
        } else {
            const result = {
                value: data[this.__i],
                done: false
            };

            this.__i++;

            return result;
        }
    }
}
