import { MarkerNodeTransformer } from "./MarkerNodeTransformer.js";
import { assert } from "../../../core/assert.js";

/**
 * Write a value in {@link MarkerNode#properties}
 */
export class MarkerNodeTransformerRecordProperty extends MarkerNodeTransformer {
    constructor() {
        super();

        /**
         *
         * @type {CellFilter}
         */
        this.value = null;

        /**
         *
         * @type {string}
         */
        this.propertyName = null;
    }

    /**
     *
     * @param {string} propertyName
     * @param {CellFilter} value
     * @returns {MarkerNodeTransformerRecordProperty}
     */
    static from(propertyName, value) {
        assert.equal(value.isCellFilter, true, "value.isCellFilter !== true");
        assert.typeOf(propertyName, "string", propertyName);

        const r = new MarkerNodeTransformerRecordProperty();

        r.propertyName = propertyName;
        r.value = value;

        return r;
    }

    initialize(grid, seed) {
        if (!this.value.initialized) {
            this.value.initialize(grid, seed);
        }
    }

    transform(node, grid) {
        const value = this.value.execute(grid, node.position.x, node.position.y, 0);

        const result = node.clone();

        result.properties[this.propertyName] = value;

        return result;
    }
}
