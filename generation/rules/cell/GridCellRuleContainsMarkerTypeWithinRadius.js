import { CellMatcher } from "../CellMatcher.js";
import { assert } from "../../../core/assert.js";

export class GridCellRuleContainsMarkerTypeWithinRadius extends CellMatcher {
    constructor() {
        super();

        /**
         * {@link MarkerNode#type}
         * @type {String}
         */
        this.type = null;

        /**
         * Search radius
         * @type {number}
         */
        this.radius = 1;
    }

    /**
     *
     * @param {String} type
     * @param {number} radius
     * @returns {GridCellRuleContainsMarkerTypeWithinRadius}
     */
    static from(type, radius) {
        assert.typeOf(type, 'string', 'type');
        assert.isNumber(radius, 'radius');

        const r = new GridCellRuleContainsMarkerTypeWithinRadius();

        r.type = type;
        r.radius = radius;

        return r;
    }

    match(grid, x, y) {
        return grid.containsMarkerInCircleByType(x, y, this.radius, this.type);
    }
}
