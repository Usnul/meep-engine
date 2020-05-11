import { GridTaskGenerator } from "../GridTaskGenerator.js";
import { CaveGeneratorCellularAutomata } from "../../automata/CaveGeneratorCellularAutomata.js";
import { countTask } from "../../../core/process/task/TaskUtils.js";
import { Sampler2D } from "../../../engine/graphics/texture/sampler/Sampler2D.js";
import TaskGroup from "../../../core/process/task/TaskGroup.js";
import { seededRandom } from "../../../core/math/MathUtils.js";
import { assert } from "../../../core/assert.js";

export class GridTaskCellularAutomata extends GridTaskGenerator {
    constructor() {
        super();

        this.tag = 0;

        this.marginLeft = 0;
        this.marginRight = 0;
        this.marginTop = 0;
        this.marginBottom = 0;

        /**
         *
         * @type {number}
         */
        this.steps = 50;
    }

    /**
     *
     * @param {number} tags
     * @param {number} margin
     */
    static from(tags, margin) {

        assert.isNumber(margin);

        const r = new GridTaskCellularAutomata();

        r.tag = tags;

        r.marginTop = margin;
        r.marginLeft = margin;
        r.marginRight = margin;
        r.marginBottom = margin;

        return r;
    }

    build(grid, ecd) {

        const field = Sampler2D.uint8(1, grid.width, grid.height);

        const automata = new CaveGeneratorCellularAutomata();

        const writeTags = this.tag;

        const mask_x0 = this.marginLeft;
        const mask_y0 = this.marginTop;

        const mask_x1 = grid.width - this.marginRight;
        const mask_y1 = grid.height - this.marginBottom;

        const mask_width = mask_x1 - mask_x0;
        const mask_height = mask_y1 - mask_y0;

        const mask_area = mask_width * mask_height;

        const random = seededRandom(this.randomSeed);

        const tSeed = countTask(0, mask_area, index => {
            const x = index % mask_width + mask_x0;
            const y = ((index / mask_width) | 0) + mask_y0;

            const field_index = y * mask_width + x;

            field.data[field_index] = (random() < 0.6) ? 1 : 0;
        });

        const tAutomata = countTask(0, this.steps, index => {
            automata.step(field.data, field.width, field.height)
        });

        tAutomata.addDependency(tSeed);

        const tWriteTags = countTask(0, grid.width * grid.height, index => {
            const cellValue = field.data[index];

            if (cellValue !== 0) {
                const tag = grid.tags[index];

                const result = tag | writeTags;

                grid.tags[index] = result;
            }
        });


        tWriteTags.addDependency(tAutomata);

        return new TaskGroup([tSeed, tAutomata, tWriteTags]);
    }
}
