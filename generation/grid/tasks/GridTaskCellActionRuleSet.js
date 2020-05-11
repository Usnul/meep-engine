import { GridTaskGenerator } from "../GridTaskGenerator.js";

export class GridTaskActionRuleSet extends GridTaskGenerator {
    constructor() {
        super();

        /**
         *
         * @type {GridActionRuleSet}
         */
        this.rules = null;
    }

    /**
     *
     * @param {GridActionRuleSet} rules
     * @returns {GridTaskActionRuleSet}
     */
    static from(rules) {
        const r = new GridTaskActionRuleSet();

        r.rules = rules;

        return r;
    }

    build(grid, ecd) {
        return this.rules.process(grid, this.randomSeed);
    }
}
