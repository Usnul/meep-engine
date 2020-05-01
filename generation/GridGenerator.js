import { Sampler2D } from "../engine/graphics/texture/sampler/Sampler2D.js";
import { seededRandom } from "../core/math/MathUtils.js";
import { CaveGeneratorCellularAutomata } from "./automata/CaveGeneratorCellularAutomata.js";
import { GridTags } from "./GridTags.js";
import { ThemeEngine } from "./theme/ThemeEngine.js";
import { AreaTheme } from "./theme/AreaTheme.js";
import { TerrainLayerRule } from "./theme/TerrainLayerRule.js";
import { TerrainTheme } from "./theme/TerrainTheme.js";
import { TagRuleContains } from "./rules/TagRuleContains.js";
import { TagRuleNot } from "./rules/TagRuleNot.js";

export class GridGenerator {
    constructor() {

        /**
         *
         * @type {GridData}
         */
        this.grid = null;

    }

    /**
     *
     * @param {EntityComponentDataset} ecd
     */
    generate(ecd) {

        //generate empty areas
        const grid = this.grid;
        const height = grid.height;
        const width = grid.width;
        const field = Sampler2D.uint8(1, width, height);

        const random = seededRandom(1);

        for (let i = 0; i < field.data.length; i++) {
            field.data[i] = (random() < 0.6) ? 1 : 0;
        }

        const automata = new CaveGeneratorCellularAutomata();

        for (let i = 0; i < 50; i++) {

            automata.step(field.data, field.width, field.height);
        }

        //tag empty areas

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {

                const cellValue = field.data[y * width + x];


                if (cellValue) {
                    grid.setTags(x, y, GridTags.Empty);
                }

            }
        }


        const themeEngine = new ThemeEngine();

        const theme0 = new AreaTheme();

        theme0.mask.resize(width, height);
        theme0.mask.mask.fill(0, 0, Math.ceil(width / 1.5), height, [1]);
        const terrainTheme = new TerrainTheme();

        const tlrGround = new TerrainLayerRule();

        tlrGround.layer = 0;
        tlrGround.rule = new TagRuleContains();
        tlrGround.rule.tags = GridTags.Empty;

        const tlrRock = new TerrainLayerRule();
        tlrGround.layer = 1;
        const rockRule = new TagRuleNot();
        rockRule.source = new TagRuleContains();
        rockRule.source.tags = GridTags.Empty;

        tlrRock.rule = rockRule;

        terrainTheme.rules.push(tlrGround);
        terrainTheme.rules.push(tlrRock);
        theme0.terrain = terrainTheme;

        themeEngine.add(theme0);

        const theme1 = new AreaTheme();

        theme1.mask.resize(width, height);
        theme1.mask.mask.fill(Math.floor(width / 3), 0, Math.ceil(width / 1.5), height, [1]);
        const terrainTheme1 = new TerrainTheme();

        const tlrGround1 = new TerrainLayerRule();

        tlrGround1.layer = 2;
        tlrGround1.rule = new TagRuleContains();
        tlrGround1.rule.tags = GridTags.Empty;

        const tlrRock1 = new TerrainLayerRule();
        tlrRock1.layer = 3;
        const rockRule1 = new TagRuleNot();
        rockRule1.source = new TagRuleContains();
        rockRule1.source.tags = GridTags.Empty;

        tlrRock1.rule = rockRule1;

        terrainTheme1.rules.push(tlrGround1);
        terrainTheme1.rules.push(tlrRock1);
        theme1.terrain = terrainTheme1;

        themeEngine.add(theme1);
        themeEngine.apply(grid, ecd);
    }
}
