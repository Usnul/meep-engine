import { CellMatcher } from "./CellMatcher.js";

export class CellMatcherContainsTag extends CellMatcher {
    constructor() {
        super();

        /**
         * Mask
         * @type {number}
         */
        this.tags = 0;
    }

    match(grid, x, y) {
        let tags;

        if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) {
            tags = 0;
        } else {
            tags = grid.readTags(x, y);
        }

        return (tags & this.tags) === this.tags;
    }

    /**
     *
     * @param {number} mask
     * @return {CellMatcherContainsTag}
     */
    static from(mask) {
        const r = new CellMatcherContainsTag();

        r.tags = mask;

        return r;
    }
}
