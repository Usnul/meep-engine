import { GridActionRuleSet } from "./markers/GridActionRuleSet.js";

export class GridGeneratorConfig {
    constructor() {

        /**
         *
         * @type {number}
         */
        this.seed = 0;

        /**
         *
         * @type {GridActionRuleSet}
         */
        this.cellActionRules = new GridActionRuleSet();

        /**
         *
         * @type {number}
         */
        this.edgeWidth = 10;

    }
}
