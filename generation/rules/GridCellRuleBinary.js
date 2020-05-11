import { GridCellRule } from "./GridCellRule.js";

export class GridCellRuleBinary extends GridCellRule {

    constructor() {
        super();

        /**
         *
         * @type {GridCellRule}
         */
        this.left = null;
        /**
         *
         * @type {GridCellRule}
         */
        this.right = null;
    }
}
