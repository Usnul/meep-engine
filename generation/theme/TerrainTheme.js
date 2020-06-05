import { seededRandom } from "../../core/math/MathUtils.js";
import { assert } from "../../core/assert.js";

export class TerrainTheme {
    constructor() {
        /**
         *
         * @type {TerrainLayerRule[]}
         */
        this.rules = [];
    }

    /**
     *
     * @param {GridData} grid
     * @param {number} seed
     */
    initialize(grid, seed) {
        assert.equal(grid.isGridData, true, 'grid.isGridData !== true');
        assert.typeOf(seed, 'number', 'seed');

        const rules = this.rules;
        const n = rules.length;

        const random = seededRandom(seed);

        for (let i = 0; i < n; i++) {
            const rule = rules[i];

            const ruleSeed = random();

            rule.filter.initialize(grid, ruleSeed);
        }
    }
}
