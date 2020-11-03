import { MarkerNodeEntityProcessor } from "./MarkerNodeEntityProcessor.js";
import { assert } from "../../../../core/assert.js";

export class MarkerNodeEntityProcessorSequence extends MarkerNodeEntityProcessor {
    constructor() {
        super();

        /**
         *
         * @type {MarkerNodeEntityProcessor[]}
         */
        this.elements = [];
    }

    /**
     *
     * @param {MarkerNodeEntityProcessor[]} elements
     * @return {MarkerNodeEntityProcessorSequence}
     */
    static from(elements) {
        const r = new MarkerNodeEntityProcessorSequence();

        elements.forEach(r.add, r);

        return r;
    }

    /**
     *
     * @param {MarkerNodeEntityProcessor} element
     */
    add(element) {
        assert.defined(element, 'element');
        assert.notNull(element, 'element');

        assert.equal(element.isMarkerNodeEntityProcessor, true, 'element.isMarkerNodeEntityProcessor !== true');

        this.elements.push(element);
    }

    initialize(data, ecd) {
        const elements = this.elements;
        const n = elements.length;

        for (let i = 0; i < n; i++) {
            const element = elements[i];

            element.initialize(data, ecd);
        }

    }

    execute(entity, node, data, ecd) {
        const elements = this.elements;
        const n = elements.length;

        for (let i = 0; i < n; i++) {
            const element = elements[i];

            element.execute(entity, node, data, ecd);
        }

    }
}
