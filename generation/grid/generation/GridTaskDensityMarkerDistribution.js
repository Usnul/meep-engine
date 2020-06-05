import { GridTaskGenerator } from "../GridTaskGenerator.js";
import Task from "../../../core/process/task/Task.js";
import { clamp, seededRandom } from "../../../core/math/MathUtils.js";
import TaskSignal from "../../../core/process/task/TaskSignal.js";
import { NumericInterval } from "../../../core/math/interval/NumericInterval.js";
import { MarkerNodeMatcherAny } from "../../markers/matcher/MarkerNodeMatcherAny.js";
import { assert } from "../../../core/assert.js";


/**
 *
 * @param {number} radius
 */
function estimateDensityTarget(radius) {
    const area = Math.PI * radius * radius;

    return area;
}

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

        const SUB_SAMPLE_COUNT = 8;

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

            node.transform.scale.multiplyScalar(markerScale);

            const overlap = grid.containsMarkerInCircle(_x, _y, node.size, MarkerNodeMatcherAny.INSTANCE);

            if (overlap) {
                rejectedSampleBudget--;
                iterationLimit++;

                if (rejectedSampleBudget <= 0) {
                    //rejection budget exhausted, terminate
                    return TaskSignal.EndSuccess;
                } else {
                    return TaskSignal.Continue;
                }

            }

            // the way iteration is set up, we aim to update the iteration limit based on actual area taken up by the placed marker with respect to target density
            const actualDensity = estimateDensityTarget(node.size);

            // Compute deviation in number of samples using actual density and desired density
            const sampleCountError = densityValue / actualDensity;

            iterationLimit += sampleCountError * SUB_SAMPLE_COUNT;

            grid.addMarker(node);

            return TaskSignal.Continue;
        }

        function initializer() {

            iterationLimit = grid.height * grid.width * SUB_SAMPLE_COUNT;
            iteration = 0;

            rejectedSampleBudget = iterationLimit * 0.15;

            if (!density.initialized) {
                density.initialize(grid, seed);
            }

            action.initialize(grid, seed);

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

                return clamp(iteration / iterationLimit, 0, 1);
            }
        });
    }
}
