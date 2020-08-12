import { GridCellAction } from "./GridCellAction.js";
import { assert } from "../../../core/assert.js";

export class GridCellActionWriteFilterToLayer extends GridCellAction {
    constructor() {
        super();


        /**
         *
         * @type {CellFilter}
         */
        this.filter = null;

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

    /**
     *
     * @param {string} layer
     * @param {CellFilter} filter
     */
    static from(layer, filter) {
        assert.typeOf(layer, 'string', "layer");
        assert.equal(filter.isCellFilter, true, 'filter.isCellFilter !== true');

        const r = new GridCellActionWriteFilterToLayer();

        r.layerId = layer;
        r.filter = filter;

        return r;
    }

    initialize(data, seed) {
        super.initialize(data, seed);

        const layer = data.getLayerById(this.layerId);

        if (layer === undefined) {
            throw new Error(`Layer '${this.layerId}' not found`);
        }

        this.__layer = layer;


        this.filter.initialize(data, seed);
    }

    execute(data, x, y, rotation) {

        const value = this.filter.execute(data, x, y, rotation);

        // convert coordinates to UV
        const u = x / (data.width - 1);
        const v = y / (data.height - 1);

        /**
         *
         * @type {GridDataLayer}
         */
        const layer = this.__layer;

        /**
         *
         * @type {Sampler2D}
         */
        const sampler = layer.sampler;

        const _x = u * (sampler.width - 1)
        const _y = v * (sampler.height - 1);

        // round the coordinates to nearest integer
        const iX = Math.round(_x);
        const iY = Math.round(_y);

        // write
        sampler.writeChannel(iX, iY, 0, value);
    }
}
