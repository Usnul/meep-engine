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

            const actions = rule.actions;

            const nActions = actions.length;

            for (let k = 0; k < nActions; k++) {
                const action = actions[k];

                action.execute(grid, ecd, node);
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

        return new Task({
            initializer() {
                grid.markers.getRawData(nodes);
            },
            cycleFunction() {
                if (i >= nodes.length) {
                    return TaskSignal.EndSuccess;
                }

                const node = nodes[i];

                for (let j = 0; j < ruleCount; j++) {
                    const rule = rules[j];

                    const isMatch = rule.matcher.match(node);

                    if (!isMatch) {
                        continue;
                    }

                    const actions = rule.actions;

                    const nActions = actions.length;

                    for (let k = 0; k < nActions; k++) {
                        const action = actions[k];

                        action.execute(grid, ecd, node);
                    }

                }

                i++;

                return TaskSignal.Continue;
            }
        })
    }
}
