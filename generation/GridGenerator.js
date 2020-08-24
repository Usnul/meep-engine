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
     * @param {number} seed
     * @returns {TaskGroup}
     */
    generate(ecd, grid, seed) {

        /**
         *
         * @type {TaskGroup[]}
         */
        const tasks = [];

        const n = this.generators.length;

        //generate tasks
        for (let i = 0; i < n; i++) {
            const generator = this.generators[i];

            const task = generator.build(grid, ecd, seed);

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
                    throw new Error(`Dependency ${j}(name='${dependency.name}') of task generator [${i}] (name='${generator.name}') is not found`);
                }

                const dependencyTask = tasks[dependencyIndex];

                task.addDependency(dependencyTask);
            }

            if (!ENV_PRODUCTION) {
                catchGeneratorErrors(generator, task);
            }
        }

        return new TaskGroup(tasks, 'Grid Generator');
    }
}


/**
 *
 * @param {GridTaskGenerator} generator
 * @param {TaskGroup} task
 */
function catchGeneratorErrors(generator, task) {

    task.promise().catch(reason => {
        console.error(`Generator '${generator.name}' failed. Task status: ${task.getVerboseStatusMessage()}`);
    });

}
