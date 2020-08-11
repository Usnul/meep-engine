import { GridTaskGenerator } from "../../../GridTaskGenerator.js";
import { actionTask } from "../../../../../core/process/task/TaskUtils.js";
import BinaryHeap from "../../../../../engine/navigation/grid/FastBinaryHeap.js";

export class GridTaskDistanceToMarkers extends GridTaskGenerator {
    constructor() {
        super();

        /**
         *
         * @type {CellMatcher}
         */
        this.traversible = null;

        /**
         *
         * @type {string}
         */
        this.layer = null;

        /**
         *
         * @type {number}
         */
        this.initial = 65535;
    }

    buildChunks() {

        const open = new BinaryHeap(function (i) {
            return target[i];
        });
    }

    build(grid, ecd, seed) {


        const initial = this.initial;

        /**
         *
         * @type {GridDataLayer}
         */
        const layer = grid.getLayerById(this.layer);

        if (layer === undefined) {
            throw new Error(`Layer '${this.layer}' doesn't exist`);
        }

        const target = layer.sampler.data;

        const traversible = this.traversible;

        // initialize
        const tInitialize = actionTask(() => {
            //initialize target
            target.fill(initial);


            traversible.initialize(grid, seed);
        });


        // first we need to split the level into fixed size chunks
        this.buildChunks();

    }
}
