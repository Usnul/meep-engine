import { PI_HALF, seededRandom } from "../../core/math/MathUtils.js";
import { assert } from "../../core/assert.js";
import { randomCountTask } from "../../core/process/task/TaskUtils.js";
import { RuleSelectionPolicyType } from "./RuleSelectionPolicyType.js";
import { ArrayIteratorSequential } from "../../core/collection/array/ArrayIteratorSequential.js";
import { ArrayIteratorRandom } from "../../core/collection/array/ArrayIteratorRandom.js";


/**
 *
 * @enum {Class<AbstractArrayIterator>}
 */
const POLICY_ITERATORS = {
    [RuleSelectionPolicyType.Sequential]: ArrayIteratorSequential,
    [RuleSelectionPolicyType.Random]: ArrayIteratorRandom
};

export class GridActionRuleSet {
    constructor() {
        /**
         *
         * @type {GridCellPlacementRule[]}
         */
        this.elements = [];

        /**
         *
         * @type {RuleSelectionPolicyType|number}
         */
        this.policy = RuleSelectionPolicyType.Sequential;
    }

    /**
     *
     * @param {GridCellPlacementRule[]} rules
     * @param {RuleSelectionPolicyType} policy
     * @returns {GridActionRuleSet}
     */
    static from(rules, policy = RuleSelectionPolicyType.Sequential) {
        assert.enum(policy, RuleSelectionPolicyType, 'policy');

        const r = new GridActionRuleSet();

        rules.forEach(r.add, r);
        r.policy = policy;

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

        /**
         * @type {Class<AbstractArrayIterator>}
         */
        const RuleIteratorClass = POLICY_ITERATORS[this.policy];

        /**
         *
         * @type {AbstractArrayIterator<GridCellPlacementRule>}
         */
        const ruleIterator = new RuleIteratorClass();


        return randomCountTask(seed, 0, gridSize, index => {
            const y = (index / width) | 0;
            const x = index % width;

            ruleIterator.initialize(this.elements);

            let iteratorValue = ruleIterator.next();

            while (!iteratorValue.done) {
                /**
                 *
                 * @type {GridCellPlacementRule}
                 */
                const element = iteratorValue.value;

                const matcher = element.pattern;

                for (let j = 0; j < 4; j++) {

                    if (j > 0 && !element.allowRotation) {
                        break;
                    }

                    const rotation = j * PI_HALF;

                    const match = matcher.match(grid, x, y, rotation);

                    if (!match) {
                        continue;
                    }

                    const roll = random();

                    if (roll <= element.probability) {

                        element.execute(grid, x, y, rotation);
                        break;
                    }

                }

                iteratorValue = ruleIterator.next();
            }

        });
    }
}
