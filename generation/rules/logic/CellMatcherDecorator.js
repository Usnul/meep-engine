import { CellMatcher } from "../CellMatcher.js";

export class CellMatcherDecorator extends CellMatcher {
    constructor() {
        super();

        /**
         *
         * @type {CellMatcher}
         */
        this.source = null;
    }

    initialize(grid, seed) {
        this.source.initialize(grid, seed);
    }
}
