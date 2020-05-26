export class CellProcessingRuleSet {
    constructor() {
        /**
         *
         * @type {CellProcessingRule[]}
         */
        this.elements = [];
    }

    /**
     *
     * @param {CellProcessingRule} rule
     */
    add(rule) {
        this.elements.push(rule);
    }

    /**
     *
     * @param {number} seed
     * @param {EntityComponentDataset} ecd
     * @param {GridData} grid
     */
    initialize(seed, ecd, grid) {
        const elements = this.elements;
        const n = elements.length;
        for (let i = 0; i < n; i++) {
            const element = elements[i];

            element.initialize(seed, ecd, grid);
        }
    }
}
