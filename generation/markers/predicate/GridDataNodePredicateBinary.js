import { GridDataNodePredicate } from "./GridDataNodePredicate.js";

export class GridDataNodePredicateBinary extends GridDataNodePredicate {

    constructor() {
        super();

        /**
         *
         * @type {GridDataNodePredicate}
         */
        this.left = null;

        /**
         *
         * @type {GridDataNodePredicate}
         */
        this.right = null;
    }

    /**
     *
     * @param {boolean} left
     * @param {boolean} right
     * @returns {boolean}
     */
    operation(left, right) {
        throw new Error('NIY');
    }

    evaluate(grid, node) {
        const left = this.left.evaluate(grid, node);
        const right = this.right.evaluate(grid, node);

        return this.operation(left, right);
    }

    initialize(grid, seed) {
        this.left.initialize(grid, seed);
        this.right.initialize(grid, seed);
    }
}
