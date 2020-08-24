import { assert } from "../../core/assert.js";

export class GridTaskGenerator {
    constructor() {
        this.name = "Unnamed";

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
        assert.equal(generator.isGridTaskGenerator, true, 'generator.isGridTaskGenerator !== true');

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
     * @param {GridTaskGenerator[]} dependencies
     */
    addDependencies(dependencies) {
        const n = dependencies.length;

        for (let i = 0; i < n; i++) {
            const generator = dependencies[i];

            this.addDependency(generator);
        }
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


/**
 * @readonly
 * @type {boolean}
 */
GridTaskGenerator.prototype.isGridTaskGenerator = true;
