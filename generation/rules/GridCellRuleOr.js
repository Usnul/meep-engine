import { GridCellRuleBinary } from "./GridCellRuleBinary.js";

export class GridCellRuleOr extends GridCellRuleBinary {
    match(data, x, y) {
        return this.left.match(data, x, y) || this.right.match(data, x, y);
    }

    /**
     *
     * @param {GridCellRule} left
     * @param {GridCellRule} right
     * @returns {GridCellRuleOr}
     */
    static from(left, right) {
        const r = new GridCellRuleOr();

        r.left = left;
        r.right = right;

        return r;
    }
}
