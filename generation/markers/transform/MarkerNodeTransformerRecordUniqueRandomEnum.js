import { MarkerNodeTransformer } from "./MarkerNodeTransformer.js";
import { randomIntegerBetween, seededRandom } from "../../../core/math/MathUtils.js";
import { assert } from "../../../core/assert.js";

export class MarkerNodeTransformerRecordUniqueRandomEnum extends MarkerNodeTransformer {
    constructor() {
        super();

        /**
         *
         * @type {T[]}
         */
        this.value = [];

        /**
         *
         * @type {T[]}
         */
        this.unused = [];

        /**
         *
         * @type {string}
         */
        this.propertyName = null;

        this.random = seededRandom(0);
    }

    /**
     *
     * @param {string} propertyName
     * @param {T[]} value
     * @returns {MarkerNodeTransformerRecordUniqueRandomEnum}
     */
    static from(propertyName, value) {
        assert.isArray(value, "value");
        assert.typeOf(propertyName, "string", propertyName);

        const r = new MarkerNodeTransformerRecordUniqueRandomEnum();

        r.propertyName = propertyName;
        r.value = value;

        return r;
    }


    initialize(grid, seed) {
        this.random.setCurrentSeed(seed);

        // make a copy
        this.unused = this.value.slice();
    }


    transform(node, grid) {
        const max_index = this.unused.length - 1;

        if (max_index < 0) {
            throw new Error('All values used up');
        }

        const index = randomIntegerBetween(this.random, 0, max_index);

        const value = this.unused[index];

        this.unused.splice(index, 1);

        const result = node.clone();

        result.properties[this.propertyName] = value;

        return result;
    }
}
