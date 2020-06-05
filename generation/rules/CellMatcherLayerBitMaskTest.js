import { assert } from "../../core/assert.js";
import { GridLayerCellMatcher } from "./GridLayerCellMatcher.js";

export class CellMatcherLayerBitMaskTest extends GridLayerCellMatcher {
    constructor() {
        super();

        /**
         * Mask
         * @type {number}
         */
        this.mask = 0;
    }


    match(grid, x, y) {
        let tags;


        const layer = this.__layer;
        const sampler = layer.sampler;

        if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) {
            tags = 0;
        } else {
            tags = sampler.readChannel(x, y, 0);
        }

        return (tags & this.mask) === this.mask;
    }

    /**
     *
     * @param {number} mask
     * @param {string} layer
     * @return {CellMatcherLayerBitMaskTest}
     */
    static from(mask, layer) {

        assert.typeOf(layer, 'string', 'layer');

        const r = new CellMatcherLayerBitMaskTest();

        r.mask = mask;
        r.layerId = layer;

        return r;
    }
}
