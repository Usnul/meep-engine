import { PI_HALF, seededRandom } from "../../core/math/MathUtils.js";
import { assert } from "../../core/assert.js";
import { countTask, randomCountTask } from "../../core/process/task/TaskUtils.js";
import { RuleSelectionPolicyType } from "./RuleSelectionPolicyType.js";
import { ArrayIteratorSequential } from "../../core/collection/array/ArrayIteratorSequential.js";
import { ArrayIteratorRandom } from "../../core/collection/array/ArrayIteratorRandom.js";
import TaskGroup from "../../core/process/task/TaskGroup.js";


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
     * @param {number} [resolution=1] Number of sub-samples per single grid cell in each dimension
     * @returns {Task}
     */
    process(grid, seed, resolution = 1) {
        assert.typeOf(seed, 'number', 'seed');

        const width = grid.width;
        const height = grid.height;

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

        //initialize rules
        const tInitializeRules = countTask(0, this.elements.length, i => {
            const rule = this.elements[i];

            rule.initialize(grid, seed);
        });


        const sampleCountX = width * resolution;
        const sampleCountY = height * resolution;

        const sampleCount = sampleCountX * sampleCountY;

        const tMain = randomCountTask(seed, 0, sampleCount, index => {


            const sample_y = (index / sampleCountX) | 0;
            const sample_x = index % sampleCountX;

            const x = sample_x / resolution;
            const y = sample_y / resolution;

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

        tMain.addDependency(tInitializeRules);

        return new TaskGroup([tInitializeRules, tMain]);
    }
}
