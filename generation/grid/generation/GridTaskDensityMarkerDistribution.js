import { GridTaskGenerator } from "../GridTaskGenerator.js";
import Task from "../../../core/process/task/Task.js";
import { clamp, seededRandom } from "../../../core/math/MathUtils.js";
import TaskSignal from "../../../core/process/task/TaskSignal.js";
import { NumericInterval } from "../../../core/math/interval/NumericInterval.js";
import { MarkerNodeMatcherAny } from "../../markers/matcher/MarkerNodeMatcherAny.js";
import { assert } from "../../../core/assert.js";
import { computeStatisticalMean } from "../../../core/math/statistics/computeStatisticalMean.js";


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

        /**
         * RNG seed offset
         * @type {number}
         * @private
         */
        this.__seed = 0;
    }

    /**
     *
     * @param {CellFilter} density
     * @param {GridCellActionPlaceMarker} action
     * @param {NumericInterval} scale
     * @param {number} [seed]
     */
    static from(density, action, scale, seed = 0) {
        assert.ok(density.isCellFilter, 'density.isCellFilter');
        assert.ok(action.isGridCellActionPlaceMarker, 'action.isGridCellActionPlaceMarker');
        assert.ok(scale.isNumericInterval, 'scale.isNumericInterval');

        const r = new GridTaskDensityMarkerDistribution();

        r.scale = scale;
        r.action = action;
        r.density = density;

        r.__seed = seed;

        return r;
    }


    /**
     *
     * @param {GridData} grid
     */
    estimateTapCount(grid) {
        const random = seededRandom(99);

        /*
            for tap count we ween 3 things:
                1) size of the field
                2) average density
                3) average size of the marker
         */

        const width = grid.width;
        const height = grid.height;

        const gridSize = width * height;

        const SAMPLE_SIZE = 60 + gridSize * 0.01;

        const x_max = width - 1;
        const y_max = height - 1;

        const samplesCollisions = [];

        const samplesDensity = [];

        const samplesSize = [];

        const SIZE_SAMPLE_LIMIT = 10 + SAMPLE_SIZE * 3;

        for (let i = 0; i < SIZE_SAMPLE_LIMIT; i++) {
            const u = random();
            const v = random();

            const x = u * x_max;
            const y = v * y_max;

            const densityValue = this.density.execute(grid, x, y, 0);

            const density = clamp(densityValue, 0, 1);

            samplesDensity.push(density);

            if (density <= 0) {
                continue;
            }

            const node = this.action.buildNode(grid, x, y, 0);

            const markerScale = this.scale.sampleRandom(random);

            //modify size and scale
            node.size *= markerScale;

            samplesSize.push(node.size);


            const overlap = grid.containsMarkerInCircle(x, y, node.size, MarkerNodeMatcherAny.INSTANCE);

            if (overlap) {
                //collision
                samplesCollisions.push(1);
            } else {
                samplesCollisions.push(0);
            }

            if (samplesSize.length >= SAMPLE_SIZE) {
                break;
            }
        }

        const collisionProbability = samplesCollisions.length > 0 ? computeStatisticalMean(samplesCollisions) : 0.01;

        const meanNodeSize = samplesSize.length > 0 ? computeStatisticalMean(samplesSize) : 1;

        //compute relative density per unit square of a single marker
        const meanSingleNodeDensity = estimateDensityTarget(meanNodeSize);

        const saturationTapCount = gridSize / meanSingleNodeDensity;

        // it is possible that a tap will collide with other existing nodes, in which situation the tap is rejected, to account for that we want to estimate how often this will happen and increase the tap count accordingly
        const collisionCompensation = clamp(1 / (1 - collisionProbability), 1, 10);

        return saturationTapCount * collisionCompensation;
    }


    build(grid, ecd, seed) {

        //we want to estimate average size of a marker

        let rejectedSampleBudget = 100;

        let iterationLimit = 0;
        let iteration = 0;

        const random = seededRandom(seed + this.__seed);

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

        const self = this;

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

            grid.addMarker(node);

            return TaskSignal.Continue;
        }

        function initializer() {
            if (!density.initialized) {
                density.initialize(grid, seed);
            }

            action.initialize(grid, seed);

            random.setCurrentSeed(seed);

            iterationLimit = self.estimateTapCount(grid);
            iteration = 0;

            assert.isNumber(iterationLimit, 'iterationLimit');
            assert.isFiniteNumber(iterationLimit, 'iterationLimit');
            assert.ok(!Number.isNaN(iterationLimit), 'iterationLimit is NaN');

            rejectedSampleBudget = iterationLimit * 0.15;
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
