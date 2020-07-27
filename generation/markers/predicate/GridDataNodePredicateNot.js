import { GridDataNodePredicate } from "./GridDataNodePredicate.js";
import { assert } from "../../../core/assert.js";

export class GridDataNodePredicateNot extends GridDataNodePredicate {
    constructor() {
        super();

        /**
         *
         * @type {GridDataNodePredicate}
         */
        this.source = null;
    }

    /**
     *
     * @param {GridDataNodePredicate} source
     * @return {GridDataNodePredicateNot}
     */
    static from(source){
        assert.equal(source.isGridDataNodePredicate,true,'source.isGridDataNodePredicate !== true');

        const r = new GridDataNodePredicateNot();

        r.source = source;

        return r;
    }

    initialize(grid, seed) {
        this.source.initialize(grid, seed);
    }

    evaluate(grid, node) {
        return !this.source.evaluate(grid, node);
    }
}
