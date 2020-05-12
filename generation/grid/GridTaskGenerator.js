export class GridTaskGenerator {
    constructor() {
        /**
         *
         * @type {number}
         */
        this.randomSeed = 0;

        /**
         *
         * @type {GridTaskGenerator[]}
         */
        this.dependencies = [];
    }

    /**
     *
     * @param {GridTaskGenerator} generator
     * @returns {boolean}
     */
    addDependency(generator) {
        const i = this.dependencies.indexOf(generator);

        if (i !== -1) {
            //dependency already exists
            return false;
        }


        this.dependencies.push(generator);

        return true;
    }

    /**
     *
     * @param {GridData} grid
     * @param {EntityComponentDataset} ecd
     * @returns {Task|TaskGroup}
     */
    build(grid, ecd) {

    }
}