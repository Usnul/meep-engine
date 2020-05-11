import { GridCellRule } from "./GridCellRule.js";

export class GridCellRuleDecorator extends GridCellRule {
    constructor() {
        super();

        /**
         *
         * @type {GridCellRule}
         */
        this.source = null;
    }
}
