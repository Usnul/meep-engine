import { GridDataNodePredicate } from "./GridDataNodePredicate.js";
import { MarkerNodeMatcherAny } from "../matcher/MarkerNodeMatcherAny.js";
import { assert } from "../../../core/assert.js";

export class GridDataNodePredicateOverlaps extends GridDataNodePredicate {
    constructor() {
        super();

        /**
         *
         * @type {MarkerNodeMatcher}
         */
        this.matcher = null;
    }

    static from(matcher = MarkerNodeMatcherAny.INSTANCE) {
        assert.equal(matcher.isMarkerNodeMatcher, true, 'matcher.isMarkerNodeMatcher !== true');

        const r = new GridDataNodePredicateOverlaps();

        r.matcher = matcher;

        return r;
    }

    evaluate(grid, node) {
        return grid.containsMarkerInCircle(node.position.x, node.position.y, node.size, this.matcher);
    }

    initialize(grid, seed) {
        
    }
}
