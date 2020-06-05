import { CellMatcher } from "../CellMatcher.js";

export class CellMatcherBinary extends CellMatcher {

    constructor() {
        super();

        /**
         *
         * @type {CellMatcher}
         */
        this.left = null;
        /**
         *
         * @type {CellMatcher}
         */
        this.right = null;
    }

    initialize(grid, seed) {
        this.left.initialize(grid, seed);
        this.right.initialize(grid, seed);
    }
}
