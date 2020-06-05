import { CellMatcherAnd } from "../logic/CellMatcherAnd.js";
import { GridPatternMatcherCell } from "./GridPatternMatcherCell.js";
import { CellMatcher } from "../CellMatcher.js";

export class GridPatternMatcher extends CellMatcher {
    constructor() {
        super();
        /**
         * NOTE: All rules have local coordinates
         * @type {GridPatternMatcherCell[]}
         */
        this.rules = [];
    }

    initialize(grid, seed) {
        const rules = this.rules;
        const n = rules.length;

        for (let i = 0; i < n; i++) {
            const rule = rules[i];

            rule.rule.initialize(grid, seed);
        }
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {CellMatcher} rule
     */
    addRule(x, y, rule) {
        const existingRule = this.getRuleByPosition(x, y);
        if (existingRule !== undefined) {
            //rule already exists, modify it
            existingRule.rule = CellMatcherAnd.from(existingRule.rule, rule);
        } else {
            const cellTagRule = new GridPatternMatcherCell();

            cellTagRule.position.set(x, y);
            cellTagRule.rule = rule;

            this.rules.push(cellTagRule);
        }
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @return {undefined|GridPatternMatcherCell}
     */
    getRuleByPosition(x, y) {
        const rules = this.rules;
        const n = rules.length;
        for (let i = 0; i < n; i++) {
            const tagRule = rules[i];

            if (tagRule.position.x === x && tagRule.position.y === y) {
                return tagRule;
            }
        }

        return undefined;
    }

    /**
     *
     * @param {GridData} grid
     * @param {number} x
     * @param {number} y
     * @param {number} rotation
     * @returns {boolean}
     */
    match(grid, x, y, rotation) {
        /**
         *
         * @type {GridPatternMatcherCell[]}
         */
        const rules = this.rules;
        const n = rules.length;

        const sin = Math.sin(rotation);
        const cos = Math.cos(rotation);

        for (let i = 0; i < n; i++) {
            const tagRule = rules[i];

            const position = tagRule.position;

            const local_y = position.y;
            const local_x = position.x;

            //rotate rule position
            const rotated_local_x = local_x * cos - local_y * sin
            const rotated_local_y = local_x * sin - local_y * cos;

            const target_x = Math.round(x + rotated_local_x);
            const target_y = Math.round(y + rotated_local_y);

            const match = tagRule.rule.match(grid, target_x, target_y, rotation);

            if (!match) {
                //rule failed
                return false;
            }
        }

        return true;
    }
}
