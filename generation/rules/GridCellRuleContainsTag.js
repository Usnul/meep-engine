import { GridCellRule } from "./GridCellRule.js";

export class GridCellRuleContainsTag extends GridCellRule {
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
     * @return {GridCellRuleContainsTag}
     */
    static from(mask) {
        const r = new GridCellRuleContainsTag();

        r.tags = mask;

        return r;
    }
}
