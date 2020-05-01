import { QuadTreeNode } from "../../core/geom/2d/quad-tree/QuadTreeNode.js";
import { assert } from "../../core/assert.js";
import { obtainTerrain } from "../../../model/game/scenes/SceneUtils.js";
import { seededRandom } from "../../core/math/MathUtils.js";
import { TerrainLayerRuleAggregator } from "./TerrainLayerRuleAggregator.js";

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
        theme.mask.updateBounds();
        theme.mask.updateDistanceField();

        const bounds = theme.mask.bounds;

        this.areas.add(theme, bounds.x0, bounds.y0, bounds.x1, bounds.y1);

    }

    /**
     *
     * @param {GridData} grid
     * @param {EntityComponentDataset} ecd
     */
    apply(grid, ecd) {
        const terrain = obtainTerrain(ecd);

        assert.notNull(terrain);

        const width = grid.width;
        const height = grid.height;

        assert.equal(width, terrain.size.x);
        assert.equal(height, terrain.size.y);

        const random = this.random;

        /**
         *
         * @type {QuadTreeDatum<AreaTheme>[]}
         */
        const areaNodes = [];

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

        const splat_step_x = splatWidth / width;
        const splat_step_y = splatHeight / height;

        for (let y = 0; y < height; y++) {
            const v = y / height;

            const splat_y = v * splatHeight;

            const splat_y0 = Math.floor(splat_y);
            const splat_y1 = Math.ceil(splat_y + splat_step_y);

            for (let x = 0; x < width; x++) {

                const u = x / width;

                const splat_x = u * splatWidth;
                const splat_x0 = Math.floor(splat_x);
                const splat_x1 = Math.ceil(splat_x + splat_step_x);


                const tags = grid.readTags(x, y);

                const intersections = this.areas.requestDatumIntersectionsRectangle(areaNodes, x - 0.1, y - 0.1, x + 0.1, y + 0.1);

                matchingThemeCount = 0;

                for (let i = 0; i < intersections; i++) {
                    const areaNode = areaNodes[i];

                    /**
                     *
                     * @type {AreaTheme}
                     */
                    const areaTheme = areaNode.data;

                    const filled = areaTheme.mask.mask.get(x, y);

                    if (filled === 0) {
                        continue;
                    }

                    matchingThemes[matchingThemeCount++] = areaTheme;
                }

                aggregator.clear();

                for (let i = 0; i < matchingThemeCount; i++) {
                    /**
                     *
                     * @type {AreaTheme}
                     */
                    const areaTheme = matchingThemes[i];

                    const areaMask = areaTheme.mask;

                    const rules = areaTheme.terrain.rules;

                    const ruleCount = rules.length;

                    for (let j = 0; j < ruleCount; j++) {
                        const terrainLayerRule = rules[j];

                        const ruleMatch = terrainLayerRule.rule.match(tags);

                        if (!ruleMatch) {
                            //terrain doesn't match the rule, skip
                            continue;
                        }

                        /**
                         *
                         * @type {number}
                         */
                        const layerIndex = terrainLayerRule.layer;

                        let power = terrainLayerRule.intensity.sampleRandom(random);


                        if (matchingThemeCount > 1) {
                            const distance = areaMask.distanceField.get(x, y);
                            const influence = distance / matchingThemeCount;

                            power *= influence;
                        }

                        aggregator.add(layerIndex, power);


                    }
                }

                aggregator.normalize();

                for (let i = 0; i < layerCount; i++) {

                    const splatLayerAddress = splatLayerSize * i;

                    const power = aggregator.powers[i];

                    const splatValue = power * 255;

                    for (let s_y = splat_y0; s_y <= splat_y1; s_y++) {

                        const rowIndex = s_y * splatWidth;

                        for (let s_x = splat_x0; s_x <= splat_x1; s_x++) {

                            const splatCellAddress = rowIndex + s_x + splatLayerAddress;


                            splatWeightData[splatCellAddress] = splatValue;

                        }

                    }

                }
            }
        }

        splat.optimize();
    }
}
