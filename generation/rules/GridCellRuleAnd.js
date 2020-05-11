import { GridCellRuleBinary } from "./GridCellRuleBinary.js";

export class GridCellRuleAnd extends GridCellRuleBinary {

    match(grid, x, y) {
        return this.left.match(grid, x, y) && this.right.match(grid, x, y);
    }

    /**
     *
     * @param {GridCellRule} left
     * @param {GridCellRule} right
     * @returns {GridCellRuleAnd}
     */
    static from(left, right) {
        const r = new GridCellRuleAnd();

        r.left = left;
        r.right = right;

        return r;
    }
}
