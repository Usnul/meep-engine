import Task from "../../../core/process/task/Task.js";
import TaskSignal from "../../../core/process/task/TaskSignal.js";
import { assert } from "../../../core/assert.js";

export class MarkerNodeProcessingRuleSet {
    constructor() {
        /**
         *
         * @type {MarkerProcessingRule[]}
         */
        this.elements = [];
    }

    /**
     *
     * @param grid
     * @param {number} seed
     */
    initialize(grid, seed) {

        assert.isNumber(seed, 'seed');

        const elements = this.elements;
        const n = elements.length;

        for (let i = 0; i < n; i++) {
            const rule = elements[i];

            rule.initialize(grid, seed);
        }
    }

    /**
     *
     * @param {MarkerProcessingRule} rule
     */
    add(rule) {
        this.elements.push(rule);
    }

    /**
     *
     * @param {GridData} grid
     * @param {EntityComponentDataset} ecd
     * @param {MarkerNode} node
     */
    processNode(grid, ecd, node) {
        assert.defined(ecd, 'node');
        assert.defined(node, 'node');


        /**
         *
         * @type {MarkerProcessingRule[]}
         */
        const rules = this.elements;
        const ruleCount = rules.length;

        for (let j = 0; j < ruleCount; j++) {
            const rule = rules[j];

            const isMatch = rule.matcher.match(node);

            if (!isMatch) {
                continue;
            }

            let _node = node;

            //perform node transformation
            const transformers = rule.transformers;

            const transformerCount = transformers.length;
            for (let k = 0; k < transformerCount; k++) {
                /**
                 *
                 * @type {MarkerNodeTransformer}
                 */
                const transformer = transformers[k];

                _node = transformer.transform(_node, grid);

                assert.defined(_node, '_node');
            }

            const actions = rule.actions;

            const nActions = actions.length;

            for (let k = 0; k < nActions; k++) {
                const action = actions[k];

                action.execute(grid, ecd, _node);
            }

            if (rule.consume) {
                //consuming rule, stop here, no more rules can be applies as node is considered to have been "consumed"
                break;
            }
        }

    }

    /**
     *
     * @param {GridData} grid
     * @param {EntityComponentDataset} ecd
     * @param {number} seed
     * @returns {Task}
     */
    process(grid, ecd, seed) {
        /**
         *
         * @type {MarkerNode[]}
         */
        const nodes = [];

        /**
         *
         * @type {MarkerProcessingRule[]}
         */
        const rules = this.elements;
        const ruleCount = rules.length;

        let i = 0;

        const self = this;

        return new Task({
            initializer() {
                grid.markers.getRawData(nodes);
            },
            estimatedDuration: (grid.width * grid.height * ruleCount) / 10000,
            computeProgress() {
                return i / nodes.length;
            },
            cycleFunction() {
                if (i >= nodes.length) {
                    return TaskSignal.EndSuccess;
                }

                const node = nodes[i];

                self.processNode(grid, ecd, node);

                i++;

                return TaskSignal.Continue;
            }
        })
    }
}
