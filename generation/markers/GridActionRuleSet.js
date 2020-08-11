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

        /**
         * Rules will be evaluated for each cell, this pattern will be applied within each cell
         * @type {number[]}
         */
        this.pattern = [0, 0];

        /**
         *
         * @type {boolean}
         */
        this.matchOrigin = true;

        /**
         *
         * @type {boolean}
         */
        this.allowEveryRotation = false;
    }

    /**
     *
     * @param {GridCellPlacementRule[]} rules
     * @param {RuleSelectionPolicyType} [policy]
     * @param {number[]} [pattern]
     * @param {boolean} [allowEveryRotation]
     * @returns {GridActionRuleSet}
     */
    static from({ rules, policy = RuleSelectionPolicyType.Sequential, pattern = [0, 0], allowEveryRotation = false }) {
        assert.enum(policy, RuleSelectionPolicyType, 'policy');
        assert.typeOf(allowEveryRotation, 'boolean', 'allowEveryRotation');

        const r = new GridActionRuleSet();

        rules.forEach(r.add, r);
        r.policy = policy;
        r.pattern = pattern;
        r.allowEveryRotation = allowEveryRotation;

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


        /**
         *
         * @type {number[]}
         */
        const pattern = this.pattern;
        const patternSize = pattern.length;

        const matchOrigin = this.matchOrigin;
        const allowEveryRotation = this.allowEveryRotation;

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

                sampling_loop: for (let sampleIndex = 0; sampleIndex < patternSize;) {
                    const sampleOffsetX = pattern[sampleIndex++];
                    const sampleOffsetY = pattern[sampleIndex++];


                    let final_sample_offset_x = sampleOffsetX;
                    let final_sample_offset_y = sampleOffsetY;

                    rotation_loop: for (let j = 0; j < 4; j++) {


                        const rotation = j * PI_HALF;

                        if (j > 0) {
                            if (!element.allowRotation) {
                                break rotation_loop;
                            } else {


                                const sin = Math.sin(rotation);
                                const cos = Math.cos(rotation);

                                final_sample_offset_x = sampleOffsetX * cos - sampleOffsetY * sin;
                                final_sample_offset_y = sampleOffsetX * sin + sampleOffsetY * cos;

                            }

                        }

                        const p_x = final_sample_offset_x + x;
                        const p_y = final_sample_offset_y + y;


                        let match;

                        if (matchOrigin) {
                            match = matcher.match(grid, x, y, rotation);
                        } else {
                            match = matcher.match(grid, p_x, p_y, rotation);
                        }

                        if (!match) {
                            continue rotation_loop;
                        }

                        const roll = random();

                        const probabilityValue = element.probability.execute(grid, p_x, p_y, rotation);

                        if (roll < probabilityValue) {

                            element.execute(grid, p_x, p_y, rotation);

                            if (!allowEveryRotation) {
                                break sampling_loop;
                            }
                        }

                    }
                }


                iteratorValue = ruleIterator.next();
            }

        });

        tMain.addDependency(tInitializeRules);

        return new TaskGroup([tInitializeRules, tMain]);
    }
}
