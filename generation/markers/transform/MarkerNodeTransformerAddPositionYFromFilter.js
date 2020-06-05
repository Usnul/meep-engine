import { MarkerNodeTransformer } from "./MarkerNodeTransformer.js";
import { assert } from "../../../core/assert.js";

export class MarkerNodeTransformerAddPositionYFromFilter extends MarkerNodeTransformer {
    constructor() {
        super();

        /**
         *
         * @type {CellFilter}
         */
        this.filter = null;
    }

    /**
     *
     * @param {CellFilter} filter
     * @returns {MarkerNodeTransformerAddPositionYFromFilter}
     */
    static from(filter) {
        assert.equal(filter.isCellFilter, true, 'filter.isCellFilter !== true');

        const r = new MarkerNodeTransformerAddPositionYFromFilter();

        r.filter = filter;

        return r;
    }

    initialize(grid, seed) {
        super.initialize(grid, seed);

        if (!this.filter.initialized) {
            this.filter.initialize(grid, seed);
        }
    }

    transform(node, grid) {
        const transform = node.transform;
        const position = transform.position;

        const tp_X = position.x;
        const tp_Y = position.z;

        const grid_position_mapping = grid.transform;

        //figure out grid position
        const grid_x = (tp_X - grid_position_mapping.offset_x) / grid_position_mapping.scale_x;
        const grid_y = (tp_Y - grid_position_mapping.offset_y) / grid_position_mapping.scale_y;

        const value = this.filter.execute(grid, grid_x, grid_y, 0);

        if (value === 0) {
            //no change
            return node;
        }

        const result = node.clone();

        result.transform.position._add(0, value, 0);

        return result;
    }
}
