import { CellMatcher } from "../CellMatcher.js";
import { assert } from "../../../core/assert.js";

export class GridCellRuleContainsMarkerWithinRadius extends CellMatcher {
    constructor() {
        super();

        /**
         * @type {MarkerNodeMatcher}
         */
        this.matcher = null;

        /**
         * Search radius
         * @type {number}
         */
        this.radius = 1;
    }

    /**
     *
     * @param {MarkerNodeMatcher} matcher
     * @param {number} radius
     * @returns {GridCellRuleContainsMarkerWithinRadius}
     */
    static from(matcher, radius) {
        assert.equal(matcher.isMarkerNodeMatcher, true, 'matcher.isMarkerNodeMatcher');
        assert.isNumber(radius, 'radius');

        const r = new GridCellRuleContainsMarkerWithinRadius();

        r.matcher = matcher;
        r.radius = radius;

        return r;
    }

    match(grid, x, y) {
        return grid.containsMarkerInCircle(x, y, this.radius, this.matcher);
    }
}
