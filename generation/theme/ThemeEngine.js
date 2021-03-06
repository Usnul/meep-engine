import { QuadTreeNode } from "../../core/geom/2d/quad-tree/QuadTreeNode.js";
import { assert } from "../../core/assert.js";
import { obtainTerrain } from "../../../model/game/scenes/SceneUtils.js";
import { randomFloatBetween, seededRandom } from "../../core/math/MathUtils.js";
import { TerrainLayerRuleAggregator } from "./TerrainLayerRuleAggregator.js";
import { actionTask, countTask, emptyTask, futureTask } from "../../core/process/task/TaskUtils.js";
import { SplatMapOptimizer } from "../../engine/ecs/terrain/ecs/splat/SplatMapOptimizer.js";
import { Sampler2D } from "../../engine/graphics/texture/sampler/Sampler2D.js";
import Task from "../../core/process/task/Task.js";
import TaskSignal from "../../core/process/task/TaskSignal.js";
import { binarySearchLowIndex } from "../../core/collection/ArrayUtils.js";
import { compareNumbers } from "../../core/primitives/numbers/compareNumbers.js";
import TaskGroup from "../../core/process/task/TaskGroup.js";
import Future from "../../core/process/Future.js";
import { optimizeIndividualMeshesEntitiesToInstances } from "../../engine/ecs/foliage/ecs/InstancedMeshUtils.js";
import TaskState from "../../core/process/task/TaskState.js";

export class ThemeEngine {
    constructor() {

        /**
         *
         * @type {QuadTreeNode<AreaTheme>}
         */
        this.areas = new QuadTreeNode();

        /**
         *
         * @type {function():number}
         */
        this.random = seededRandom(1);
    }

    /**
     *
     * @param {AreaTheme} theme
     */
    add(theme) {
        assert.defined(theme, 'theme');

        theme.mask.updateBounds();
        theme.mask.updateDistanceField();

        const bounds = theme.mask.bounds;

        this.areas.add(theme, bounds.x0, bounds.y0, bounds.x1, bounds.y1);

    }

    /**
     *
     * @param {AreaTheme} result
     * @param {number} x
     * @param {number} y
     * @returns {number}
     */
    getThemesByPosition(result, x, y) {

        const areaNodes = [];

        const intersections = this.areas.requestDatumIntersectionsPoint(areaNodes, x, y);

        let matches = 0;

        for (let i = 0; i < intersections; i++) {
            const areaNode = areaNodes[i];

            /**
             *
             * @type {AreaTheme}
             */
            const areaTheme = areaNode.data;

            const filled = areaTheme.mask.mask.readChannel(x, y, 0);

            if (filled === 0) {
                continue;
            }

            result[matches++] = areaTheme;
        }


        return matches;
    }

    /**
     *
     * @param {number} seed
     * @param {EntityComponentDataset} ecd
     * @param {GridData} grid
     * @returns {Task}
     */
    initializeThemes(seed, ecd, grid) {

        return actionTask(() => {
            /**
             *
             * @type {AreaTheme[]}
             */
            const areas = [];

            this.areas.getRawData(areas);

            /**
             *
             * @type {Theme[]}
             */
            const themes = [];

            const n = areas.length;
            for (let i = 0; i < n; i++) {
                const areaTheme = areas[i];

                const theme = areaTheme.theme;

                if (themes.indexOf(theme) === -1) {
                    themes.push(theme);

                    const seed = this.random();

                    theme.initialize(seed, ecd, grid);
                }
            }

        });
    }

    /**
     *
     * @param {GridData} grid
     * @param {Terrain} terrain
     * @returns {TaskGroup}
     */
    applyTerrainThemes(grid, terrain) {


        assert.notNull(terrain);

        const width = grid.width;
        const height = grid.height;

        assert.equal(width, terrain.size.x);
        assert.equal(height, terrain.size.y);


        const random = this.random;

        /**
         *
         * @type {AreaTheme[]}
         */
        const matchingThemes = [];

        const splat = terrain.splat;

        const layerCount = splat.depth;

        const aggregator = new TerrainLayerRuleAggregator(layerCount);

        let matchingThemeCount = 0;

        const splatWeightData = splat.weightData;

        const splatWidth = splat.size.x;
        const splatHeight = splat.size.y;

        const splatLayerSize = splatWidth * splatHeight;

        //splat map size can vary from the terrain size, for that reason we write splat weights into an intermediate storage so we can re-sample it to splat map after
        const weights = Sampler2D.uint8(layerCount, width, height);


        const tApplyThemes = countTask(0, width * height, (index) => {
            const y = (index / width) | 0;
            const x = index % width;

            matchingThemeCount = this.getThemesByPosition(matchingThemes, x, y);

            aggregator.clear();

            for (let i = 0; i < matchingThemeCount; i++) {
                /**
                 *
                 * @type {AreaTheme}
                 */
                const areaTheme = matchingThemes[i];

                const areaMask = areaTheme.mask;

                /**
                 *
                 * @type {Theme}
                 */
                const theme = areaTheme.theme;

                const rules = theme.terrain.rules;

                const ruleCount = rules.length;

                for (let j = 0; j < ruleCount; j++) {
                    const terrainLayerRule = rules[j];

                    let power = terrainLayerRule.filter.execute(grid, x, y, 0);

                    if (power <= 0) {
                        continue;
                    }

                    /**
                     *
                     * @type {number}
                     */
                    const layerIndex = terrainLayerRule.layer;


                    if (matchingThemeCount > 1) {
                        const distance = areaMask.distanceField.readChannel(x, y, 0);
                        const influence = distance / matchingThemeCount;

                        power *= influence;
                    }

                    aggregator.add(layerIndex, power);


                }
            }

            aggregator.normalize(255);

            weights.set(x, y, aggregator.powers);

        });


        //re-sample weights
        const weightSample = [];

        const tResample = countTask(0, splatWidth * splatHeight, index => {
            const y = (index / splatWidth) | 0;
            const x = index % splatWidth;

            const v = y / splatHeight;
            const u = x / splatWidth;

            const source_y = v * weights.height;
            const source_x = u * weights.width;


            weights.sampleBilinear(source_x, source_y, weightSample);

            for (let i = 0; i < layerCount; i++) {
                const targetAddress = (y * splatWidth + x) + i * splatLayerSize;
                splatWeightData[targetAddress] = weightSample[i];
            }

        });

        tResample.addDependency(tApplyThemes);


        const optimizer = new SplatMapOptimizer();
        optimizer.mapping = terrain.splat;

        const tasks = optimizer.optimize();

        tasks.forEach(t => t.addDependency(tResample));

        return new TaskGroup([tApplyThemes, tResample].concat(tasks), 'Applying a level generation theme');
    }

    /**
     *
     * @param {GridData} grid
     * @param {EntityComponentDataset} ecd
     * @param {number} seed
     * @returns {Task|TaskGroup}
     */
    applyNodes(grid, ecd, seed) {
        /**
         *
         * @type {MarkerNode[]}
         */
        const nodes = [];

        let i = 0;

        /**
         *
         * @type {AreaTheme[]}
         */
        const themeAreas = [];

        /**
         *
         * @type {number[]}
         */
        const themeInfluence = [];

        const random = seededRandom(seed);

        const cycleFunction = () => {
            if (i >= nodes.length) {
                return TaskSignal.EndSuccess;
            }

            const node = nodes[i];

            i++;

            const nodePosition = node.position;

            const x = nodePosition.x;
            const y = nodePosition.y;

            const matchingThemeCount = this.getThemesByPosition(themeAreas, x, y);

            if (matchingThemeCount === 0) {
                return TaskSignal.Continue;
            }

            let influenceSum = 0;

            //compute influences of active themes
            for (let j = 0; j < matchingThemeCount; j++) {

                /**
                 *
                 * @type {AreaTheme}
                 */
                const theme = themeAreas[j];

                const areaMask = theme.mask;

                const distance = areaMask.distanceField.readChannel(x, y, 0);
                const influence = distance / matchingThemeCount;

                themeInfluence[j] = influenceSum;

                influenceSum += influence;
            }

            //select a theme
            const t = randomFloatBetween(random, 0, influenceSum);

            const themeIndex = binarySearchLowIndex(themeInfluence, t, compareNumbers);

            const themeArea = themeAreas[themeIndex];

            /**
             *
             * @type {Theme}
             */
            const theme = themeArea.theme;

            /**
             *
             * @type {MarkerNodeProcessingRuleSet}
             */
            const ruleSet = theme.nodes;

            ruleSet.processNode(grid, ecd, node);


            return TaskSignal.Continue;
        }

        return new Task({
            initializer() {
                grid.markers.getRawData(nodes);
            },
            cycleFunction
        });
    }

    /**
     *
     * @param {GridData} grid
     * @param {EntityComponentDataset} ecd
     */
    applyCellRules(grid, ecd) {

        const width = grid.width;
        const height = grid.height;

        /**
         *
         * @type {AreaTheme[]}
         */
        const matchingThemes = [];

        return countTask(0, width * height, (index) => {
            const y = (index / width) | 0;
            const x = index % width;

            const matchingThemeCount = this.getThemesByPosition(matchingThemes, x, y);

            for (let i = 0; i < matchingThemeCount; i++) {
                const areaTheme = matchingThemes[i];

                const theme = areaTheme.theme;

                /**
                 *
                 * @type {CellProcessingRule[]}
                 */
                const cellRules = theme.cells.elements;

                const cellRuleCount = cellRules.length;

                for (let j = 0; j < cellRuleCount; j++) {
                    const rule = cellRules[j];

                    rule.action.execute(ecd, grid, x, y, 0, rule.filter);
                }
            }
        });
    }

    /**
     *
     * @param {Terrain} terrain
     * @returns {Task}
     */
    updateTerrain(terrain) {
        return emptyTask();
    }

    /**
     *
     * @returns {TaskGroup}
     * @param {EntityComponentDataset} ecd
     */
    optimize(ecd) {

        const terrain = obtainTerrain(ecd);

        const tLightMap = futureTask(new Future((resolve, reject) => {
            terrain.buildLightMap().then(resolve, reject);
        }), 'Building Lightmap');

        const optimization_task = new TaskGroup([]);

        const tOptimizeMeshes = new Task({
            name: 'Mesh optimization',
            initializer(task, executor) {

                const o = optimizeIndividualMeshesEntitiesToInstances(ecd, 10);

                optimization_task.addChildren(o.tasks);

                executor.runGroup(optimization_task);
            },
            cycleFunction() {
                const state = optimization_task.state.getValue();

                if (state === TaskState.RUNNING) {
                    return TaskSignal.Yield;
                } else if (state === TaskState.FAILED) {
                    return TaskSignal.EndFailure;
                } else if (state === TaskState.SUCCEEDED) {
                    return TaskSignal.EndSuccess;
                } else {
                    return TaskSignal.Continue;
                }
            },
            computeProgress() {
                return optimization_task.computeProgress();
            }
        });

        tOptimizeMeshes.estimatedDuration = 5;

        return new TaskGroup([tLightMap, tOptimizeMeshes]);
    }

    /**
     *
     * @param {GridData} grid
     * @param {EntityComponentDataset} ecd
     * @returns {TaskGroup}
     */
    apply(grid, ecd) {
        const terrain = obtainTerrain(ecd);

        // build terrain tiles
        const tTerrainGeometry = futureTask(new Future((resolve, reject) => {

            terrain.updateWorkerHeights();
            terrain.tiles.rebuild();

            terrain.promiseAllTiles().then(resolve, reject);
        }), 'Wait for terrain tiles');

        const tInitializeThemes = this.initializeThemes(this.random(), ecd, grid);

        const tTerrain = this.applyTerrainThemes(grid, terrain);

        const tNodes = this.applyNodes(grid, ecd);

        const tCells = this.applyCellRules(grid, ecd);

        tTerrain.addDependency(tInitializeThemes);
        tNodes.addDependencies([
            tInitializeThemes,
            tTerrainGeometry
        ]);
        tCells.addDependency(tInitializeThemes);
        tTerrainGeometry.addDependency(tCells);

        const tOptimize = this.optimize(ecd);

        const tUpdateTerrain = this.updateTerrain(terrain);

        tUpdateTerrain.addDependencies([
            tTerrain,
            tNodes,
            tCells,
            tTerrainGeometry
        ]);

        tOptimize.addDependencies([
            tUpdateTerrain,
            tTerrain,
            tNodes,
            tCells,
            tInitializeThemes
        ]);

        return new TaskGroup([tTerrainGeometry, tInitializeThemes, tTerrain, tNodes, tCells, tUpdateTerrain, tOptimize]);
    }
}
