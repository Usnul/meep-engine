import { CellFilter } from "../CellFilter.js";
import { assert } from "../../../core/assert.js";

export class CellFilterReadGridLayer extends CellFilter {
    constructor() {
        super();

        /**
         *
         * @type {string}
         */
        this.layerId = null;

        /**
         *
         * @type {GridDataLayer}
         * @private
         */
        this.__layer = null;
    }

    initialize(grid, seed) {
        super.initialize(grid, seed);

        this.__layer = grid.getLayerById(this.layerId);
    }

    /**
     *
     * @param {string} layer
     * @returns {CellFilterReadGridLayer}
     */
    static from(layer) {
        assert.typeOf(layer, 'string', 'layer');

        const r = new CellFilterReadGridLayer();

        r.layerId = layer;

        return r;
    }

    execute(grid, x, y, rotation) {

        //convert to UV
        const u = x / (grid.width - 1);
        const v = y / (grid.height - 1);


        /**
         *
         * @type {Sampler2D}
         */
        const sampler = this.__layer.sampler;

        return sampler.sampleChannelBilinearUV(u, v, 0);
    }
}
