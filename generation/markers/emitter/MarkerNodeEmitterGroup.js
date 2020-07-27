import { MarkerNodeEmitter } from "./MarkerNodeEmitter.js";
import { assert } from "../../../core/assert.js";

export class MarkerNodeEmitterGroup extends MarkerNodeEmitter {
    constructor() {
        super();
        /**
         *
         * @type {MarkerNodeEmitter[]}
         */
        this.elements = [];
    }

    /**
     *
     * @param {MarkerNodeEmitter[]} elements
     * @return {MarkerNodeEmitterGroup}
     */
    static from(elements) {
        assert.isArray(elements, 'elements');

        const r = new MarkerNodeEmitterGroup();

        r.elements = elements;

        return r;
    }

    initialize(data, seed) {
        const elements = this.elements;
        const n = elements.length;

        for (let i = 0; i < n; i++) {
            const emitter = elements[i];

            emitter.initialize(data, seed);
        }
    }

    execute(data, x, y, rotation, consumer) {

        const elements = this.elements;
        const n = elements.length;

        for (let i = 0; i < n; i++) {
            const emitter = elements[i];

            emitter.execute(data, x, y, rotation, consumer);
        }
    }
}
