import { seededRandom } from "../../core/math/MathUtils.js";

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
     * @param {number} seed
     */
    initialize(seed) {
        const rules = this.rules;
        const n = rules.length;

        const random = seededRandom(seed);

        for (let i = 0; i < n; i++) {
            const rule = rules[i];

            const ruleSeed = random();

            rule.filter.initialize(ruleSeed);
        }
    }
}
