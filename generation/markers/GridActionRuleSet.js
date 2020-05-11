import { countTask } from "../../core/process/task/TaskUtils.js";
import { PI_HALF, seededRandom } from "../../core/math/MathUtils.js";
import { assert } from "../../core/assert.js";

export class GridActionRuleSet {
    constructor() {
        /**
         *
         * @type {GridCellPlacementRule[]}
         */
        this.elements = [];
    }

    /**
     *
     * @param {GridCellPlacementRule[]} rules
     * @returns {GridActionRuleSet}
     */
    static from(rules) {
        const r = new GridActionRuleSet();

        rules.forEach(r.add, r);

        return r;
    }

    /**
     *
     * @param {GridCellPlacementRule} rule
     */
    add(rule) {
        this.elements.push(rule);
    }

    /**
     *
     * @param {GridData} grid
     * @param {number} seed
     * @returns {Task}
     */
    process(grid, seed) {
        assert.typeOf(seed, 'number', 'seed');

        const width = grid.width;
        const height = grid.height;

        const gridSize = width * height;

        const random = seededRandom(seed);

        return countTask(0, gridSize, index => {
            const y = (index / width) | 0;
            const x = index % width;

            const elements = this.elements;
            const n = elements.length;

            rule_loop: for (let i = 0; i < n; i++) {
                const element = elements[i];

                for (let j = 0; j < 4; j++) {

                    const rotation = j * PI_HALF;

                    const match = element.pattern.match(grid, x, y, rotation);

                    if (!match) {
                        continue;
                    }

                    const roll = random();

                    if (roll > element.probability) {
                        //probability roll too high
                        continue rule_loop;
                    }

                    element.execute(grid, x, y, rotation);
                    break;
                }
            }
        });
    }
}
