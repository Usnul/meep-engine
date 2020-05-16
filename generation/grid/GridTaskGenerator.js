export class GridTaskGenerator {
    constructor() {
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
     * @param {number} seed
     * @returns {Task|TaskGroup}
     */
    build(grid, ecd, seed) {

    }
}
