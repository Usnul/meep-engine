import { CellMatcher } from "./CellMatcher.js";

export class GridLayerCellMatcher extends CellMatcher {
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
         * @protected
         */
        this.__layer = null;
    }


    initialize(grid, seed) {
        const layer = grid.getLayerById(this.layerId);

        if (layer === undefined) {
            throw new Error(`Layer '${this.layerId}' not found`);
        }

        this.__layer = layer;
    }
}
