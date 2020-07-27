import { GridDataNodePredicateBinary } from "./GridDataNodePredicateBinary.js";
import { assert } from "../../../core/assert.js";

export class GridDataNodePredicateAnd extends GridDataNodePredicateBinary {
    /**
     *
     * @param {GridDataNodePredicate} left
     * @param {GridDataNodePredicate} right
     * @return {GridDataNodePredicateAnd}
     */
    static from(left, right) {

        assert.equal(left.isGridDataNodePredicate, true, 'left.isGridDataNodePredicate !== true');
        assert.equal(right.isGridDataNodePredicate, true, 'right.isGridDataNodePredicate !== true');

        const r = new GridDataNodePredicateAnd();

        r.left = left;
        r.right = right;

        return r;
    }

    evaluate(grid, node) {

        if (!this.left.evaluate(grid, node)) {
            return false;
        }

        return this.right.evaluate(grid, node);
    }
}
