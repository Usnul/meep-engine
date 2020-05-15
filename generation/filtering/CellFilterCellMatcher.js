import { CellFilter } from "./CellFilter.js";
import { assert } from "../../core/assert.js";

/**
 * Converts {@link CellMatcher} output to 0 or 1
 */
export class CellFilterCellMatcher extends CellFilter {
    constructor() {
        super();

        /**
         *
         * @type {CellMatcher}
         */
        this.matcher = null;
    }

    /**
     *
     * @param {CellMatcher} matcher
     * @returns {CellFilterCellMatcher}
     */
    static from(matcher) {
        assert.defined(matcher, 'matcher');
        assert.equal(matcher.isCellMatcher, true, 'matcher.isCellMatcher');


        const r = new CellFilterCellMatcher();

        r.matcher = matcher;

        return r;
    }

    execute(grid, x, y, rotation) {
        const isMatch = this.matcher.match(grid, x, y, rotation);


        return isMatch ? 1 : 0;
    }
}
