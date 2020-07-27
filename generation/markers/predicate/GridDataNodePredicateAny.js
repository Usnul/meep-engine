import { GridDataNodePredicate } from "./GridDataNodePredicate.js";

export class GridDataNodePredicateAny extends GridDataNodePredicate {
    evaluate(grid, node) {
        return true;
    }
}

/**
 * @readonly
 * @type {GridDataNodePredicateAny}
 */
GridDataNodePredicateAny.INSTANCE = new GridDataNodePredicateAny();
