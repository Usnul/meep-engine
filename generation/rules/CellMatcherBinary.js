import { CellMatcher } from "./CellMatcher.js";

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
}
