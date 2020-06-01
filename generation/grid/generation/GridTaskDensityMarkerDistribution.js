import { GridTaskGenerator } from "../GridTaskGenerator.js";
import Task from "../../../core/process/task/Task.js";
import { seededRandom } from "../../../core/math/MathUtils.js";
import TaskSignal from "../../../core/process/task/TaskSignal.js";
import { NumericInterval } from "../../../core/math/interval/NumericInterval.js";
import { MarkerNodeMatcherAny } from "../../markers/matcher/MarkerNodeMatcherAny.js";
import { assert } from "../../../core/assert.js";

export class GridTaskDensityMarkerDistribution extends GridTaskGenerator {
    constructor() {
        super();

        /**
         *
         * @type {CellFilter}
         */
        this.density = null;

        /**
         *
         * @type {GridCellActionPlaceMarker}
         */
        this.action = null;

        /**
         *
         * @type {NumericInterval}
         */
        this.scale = new NumericInterval(1, 1);
    }

    /**
     *
     * @param {CellFilter} density
     * @param {GridCellActionPlaceMarker} action
     * @param {NumericInterval} scale
     */
    static from(density, action, scale) {
        assert.ok(density.isCellFilter, 'density.isCellFilter');
        assert.ok(action.isGridCellActionPlaceMarker, 'action.isGridCellActionPlaceMarker');
        assert.ok(scale.isNumericInterval, 'scale.isNumericInterval');

        const r = new GridTaskDensityMarkerDistribution();

        r.scale = scale;
        r.action = action;
        r.density = density;

        return r;
    }

    build(grid, ecd, seed) {

        let rejectedSampleBudget = 100;

        let iterationLimit = 0;
        let iteration = 0;

        const random = seededRandom(seed);

        /**
         *
         * @type {CellFilter}
         */
        const density = this.density;

        /**
         *
         * @type {GridCellActionPlaceMarker}
         */
        const action = this.action;

        /**
         *
         * @type {NumericInterval}
         */
        const scale = this.scale;

        /**
         * @returns {TaskSignal}
         */
        function cycleFunction() {

            if (iteration >= iterationLimit) {
                //iteration budget exhausted
                return TaskSignal.EndSuccess;
            }

            iteration++;

            //pick point
            const u = random();
            const v = random();

            const _x = u * grid.width;
            const _y = v * grid.height;

            //sample density mask
            const densityValue = density.execute(grid, _x, _y, 0);

            if (densityValue === 0) {
                // 0% chance
                return TaskSignal.Continue;
            }

            //do a roll to check if we should place a marker here
            const densityRoll = random();

            if (densityRoll > densityValue) {
                //probability roll against density value failed
                return TaskSignal.Continue;
            }

            const node = action.buildNode(grid, _x, _y, 0);

            const markerScale = scale.sampleRandom(random);

            //modify size and scale
            node.size *= markerScale;

            node.transofrm.scale.multiplyScalar(markerScale);

            const overlap = grid.containsMarkerInCircle(_x, _y, node.size, MarkerNodeMatcherAny.INSTANCE);

            if (overlap) {
                rejectedSampleBudget--;

                if (rejectedSampleBudget <= 0) {
                    //rejection budget exhausted, terminate
                    return TaskSignal.EndSuccess;
                } else {
                    return TaskSignal.Continue;
                }

            }

            grid.addMarker(node);

            return TaskSignal.Continue;
        }

        function initializer() {
            rejectedSampleBudget = grid.height * grid.height * 0.2;

            iterationLimit = grid.height * grid.width * 8;
            iteration = 0;


            if (!density.initialized) {
                density.initialize(seed);
            }

            random.setCurrentSeed(seed);
        }

        return new Task({
            name: 'Density marker distribution',
            cycleFunction,
            initializer,
            estimatedDuration: grid.height * grid.width / 6000,
            computeProgress() {
                if (iterationLimit === 0) {
                    return 0;
                }

                return iteration / iterationLimit;
            }
        });
    }
}
