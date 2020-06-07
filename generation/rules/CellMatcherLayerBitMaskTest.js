import { assert } from "../../core/assert.js";
import { GridLayerCellMatcher } from "./GridLayerCellMatcher.js";
import { clamp } from "../../core/math/MathUtils.js";

export class CellMatcherLayerBitMaskTest extends GridLayerCellMatcher {
    constructor() {
        super();

        /**
         * Mask
         * @type {number}
         */
        this.mask = 0;
    }


    match(grid, x, y, rotation) {


        const layer = this.__layer;
        const sampler = layer.sampler;

        //convert to uv
        const x_max = grid.width - 1;
        const y_max = grid.height - 1;

        let u;
        let v;

        if (x_max === 0) {
            u = 0;
        } else {
            u = clamp(x / x_max, 0, 1);
        }

        if (y_max === 0) {
            v = 0;
        } else {
            v = clamp(y / y_max, 0, 1);
        }

        const _x = Math.round(u * (sampler.width - 1));
        const _y = Math.round(v * (sampler.height - 1));

        const tags = sampler.readChannel(_x, _y, 0);

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
