import { GridTaskGenerator } from "../../GridTaskGenerator.js";
import { assert } from "../../../../core/assert.js";

export class GridTaskActionRuleSet extends GridTaskGenerator {
    constructor() {
        super();

        /**
         *
         * @type {GridActionRuleSet}
         */
        this.rules = null;

        /**
         *
         * @type {number}
         */
        this.resolution = 1;
    }

    /**
     *
     * @param name
     * @param {GridActionRuleSet} rules
     * @param {number} [resolution=1]
     * @returns {GridTaskActionRuleSet}
     */
    static from({ name, rules, resolution = 1 }) {
        assert.isNumber(resolution, 'resolution');

        const r = new GridTaskActionRuleSet();

        r.rules = rules;
        r.resolution = resolution;

        if (name !== undefined) {
            r.name = name;
        }

        return r;
    }

    build(grid, ecd, seed) {
        return this.rules.process(grid, seed, this.resolution);
    }
}
