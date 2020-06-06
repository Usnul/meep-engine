import { GridTaskGenerator } from "../GridTaskGenerator.js";
import TaskGroup from "../../../core/process/task/TaskGroup.js";

export class GridTaskSequence extends GridTaskGenerator {
    constructor() {
        super();

        /**
         *
         * @type {GridTaskGenerator[]}
         */
        this.children = [];
    }

    /**
     *
     * @param {GridTaskGenerator[]} children
     * @returns {GridTaskSequence}
     */
    static from(children) {
        const r = new GridTaskSequence();

        r.children = children;

        return r;
    }

    build(grid, ecd, seed) {
        const children = this.children;
        const n = children.length;

        const tasks = [];

        for (let i = 0; i < n; i++) {
            const child = children[i];

            const task = child.build(grid, ecd, seed);

            if (tasks.length > 0) {
                task.addDependency(tasks[tasks.length - 1]);
            }

            tasks.push(task);
        }

        return new TaskGroup(tasks, 'Grid Task Sequence');
    }
}
