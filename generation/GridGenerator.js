import TaskGroup from "../core/process/task/TaskGroup.js";

export class GridGenerator {
    constructor() {

        /**
         *
         * @type {GridTaskGenerator[]}
         */
        this.generators = [];

    }

    /**
     *
     * @param {GridTaskGenerator} generator
     */
    addGenerator(generator) {
        this.generators.push(generator);
    }

    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {GridData} grid
     * @returns {TaskGroup}
     */
    generate(ecd, grid) {

        const tasks = [];

        const n = this.generators.length;

        //generate tasks
        for (let i = 0; i < n; i++) {
            const generator = this.generators[i];

            const task = generator.build(grid, ecd);

            tasks[i] = task;
        }

        //assign dependencies
        for (let i = 0; i < n; i++) {
            const generator = this.generators[i];

            const task = tasks[i];

            const dependencies = generator.dependencies;

            const dependencyCount = dependencies.length;

            for (let j = 0; j < dependencyCount; j++) {

                const dependency = dependencies[j];

                const dependencyIndex = this.generators.indexOf(dependency);

                if (dependencyIndex === -1) {
                    throw new Error(`Dependency ${j} of task generator [${i}] is not found`);
                }

                const dependencyTask = tasks[dependencyIndex];

                task.addDependency(dependencyTask);
            }
        }

        return new TaskGroup(tasks, 'Grid Generator');
    }
}
