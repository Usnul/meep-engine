import { AbstractGridCellMatcher } from "./AbstractGridCellMatcher.js";

export class GirdCellMatcherBinary extends AbstractGridCellMatcher{

    constructor() {
        super();

        /**
         *
         * @type {AbstractGridCellMatcher}
         */
        this.left = null;
        /**
         *
         * @type {AbstractGridCellMatcher}
         */
        this.right = null;
    }

}
