import { MarkerNodeTransformer } from "./MarkerNodeTransformer.js";
import { assert } from "../../../core/assert.js";
import { seededRandom } from "../../../core/math/MathUtils.js";

export class MarkerNodeTransformerRecordPropertyClosure extends MarkerNodeTransformer {
    constructor() {
        super();

        /**
         *
         * @type {function}
         */
        this.value = null;

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
     * @param {function(node:MarkerNode, random:function, grid:GridData):*} value
     * @returns {MarkerNodeTransformerRecordPropertyClosure}
     */
    static from(propertyName, value) {
        assert.typeOf(value, 'function', "value");
        assert.typeOf(propertyName, "string", propertyName);

        const r = new MarkerNodeTransformerRecordPropertyClosure();

        r.propertyName = propertyName;
        r.value = value;

        return r;
    }


    initialize(grid, seed) {
        this.random.setCurrentSeed(seed);
    }


    transform(node, grid) {
        const value = this.value(node, this.random, grid);

        const result = node.clone();

        result.properties[this.propertyName] = value;

        return result;
    }
}
