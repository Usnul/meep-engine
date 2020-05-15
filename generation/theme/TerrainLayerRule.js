import { assert } from "../../core/assert.js";

export class TerrainLayerRule {
    constructor() {
        /**
         *
         * @type {CellFilter}
         */
        this.filter = null;
        /**
         *
         * @type {number}
         */
        this.layer = 0;

    }

    /**
     *
     * @param {CellFilter} filter
     * @param {number} layer
     * @returns {TerrainLayerRule}
     */
    static from(filter, layer) {

        assert.equal(filter.isCellFilter, true, 'filter.isCellFilter');
        assert.isNumber(layer, 'layer');

        const r = new TerrainLayerRule();

        r.filter = filter;
        r.layer = layer;

        return r;
    }
}
