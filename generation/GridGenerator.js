import { Sampler2D } from "../engine/graphics/texture/sampler/Sampler2D.js";
import { seededRandom } from "../core/math/MathUtils.js";
import { CaveGeneratorCellularAutomata } from "./automata/CaveGeneratorCellularAutomata.js";
import { GridTags } from "./GridTags.js";
import { actionTask } from "../core/process/task/TaskUtils.js";
import TaskGroup from "../core/process/task/TaskGroup.js";

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
     * @param {GridGeneratorConfig} config
     */
    generateEmptyTags(config) {

        const grid = this.grid;
        const height = grid.height;
        const width = grid.width;

        const field = Sampler2D.uint8(1, width, height);

        const random = seededRandom(config.seed);

        const fieldData = field.data;

        const y0 = config.edgeWidth;
        const y1 = height - config.edgeWidth;

        const x0 = config.edgeWidth;
        const x1 = width - config.edgeWidth;

        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
                const index = y * width + x;

                fieldData[index] = (random() < 0.6) ? 1 : 0;
            }
        }

        const automata = new CaveGeneratorCellularAutomata();

        for (let i = 0; i < 50; i++) {

            automata.step(field.data, field.width, field.height);
        }

        //tag empty areas

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {

                const cellValue = field.data[y * width + x];


                if (cellValue !== 0) {
                    grid.setTags(x, y, GridTags.Empty);
                }

            }
        }
    }

    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {GridGeneratorConfig} config
     */
    generate(ecd, config) {

        //generate empty areas
        const grid = this.grid;
        const height = grid.height;
        const width = grid.width;

        const tMakeEmpty = actionTask(() => {
            this.generateEmptyTags(config);
        });

        const tActions = config.cellActionRules.process(grid, config.seed);

        tActions.addDependency(tMakeEmpty);

        return new TaskGroup([tMakeEmpty, tActions], 'Generation');
    }
}
