import { GridTaskGenerator } from "../../GridTaskGenerator.js";
import { CaveGeneratorCellularAutomata } from "../../../automata/CaveGeneratorCellularAutomata.js";
import { actionTask, countTask } from "../../../../core/process/task/TaskUtils.js";
import { Sampler2D } from "../../../../engine/graphics/texture/sampler/Sampler2D.js";
import TaskGroup from "../../../../core/process/task/TaskGroup.js";
import { seededRandom } from "../../../../core/math/MathUtils.js";
import { assert } from "../../../../core/assert.js";

export class GridTaskCellularAutomata extends GridTaskGenerator {
    constructor() {
        super();

        this.marginLeft = 0;
        this.marginRight = 0;
        this.marginTop = 0;
        this.marginBottom = 0;

        /**
         *
         * @type {number}
         */
        this.steps = 50;

        /**
         * Probability of cell being initialized at filled
         * @type {number}
         */
        this.threshold = 0.57;

        /**
         *
         * @type {GridCellAction}
         */
        this.action = null;
    }

    /**
     *
     * @param name
     * @param {GridCellAction} action
     * @param {number} [margin]
     * @param {number} [threshold]
     */
    static from({ name = 'cellular automata', action, margin = 0, threshold = 0.57 }) {
        assert.equal(action.isGridCellAction, true, 'action.isGridCellAction !== true');
        assert.isNumber(margin);
        assert.isNumber(threshold);

        const r = new GridTaskCellularAutomata();

        r.action = action;

        r.threshold = threshold;

        r.marginTop = margin;
        r.marginLeft = margin;
        r.marginRight = margin;
        r.marginBottom = margin;

        r.name = name;

        return r;
    }

    build(grid, ecd, seed) {

        const width = grid.width;
        const field = Sampler2D.uint8(1, width, grid.height);

        const automata = new CaveGeneratorCellularAutomata();

        const mask_x0 = this.marginLeft;
        const mask_y0 = this.marginTop;

        const mask_x1 = width - this.marginRight;
        const mask_y1 = grid.height - this.marginBottom;

        const mask_width = mask_x1 - mask_x0;
        const mask_height = mask_y1 - mask_y0;

        const mask_area = mask_width * mask_height;

        const random = seededRandom(seed);

        const threshold = this.threshold;

        // initial seeding
        const tSeed = countTask(0, mask_area, index => {
            const x = index % mask_width + mask_x0;
            const y = ((index / mask_width) | 0) + mask_y0;

            const field_index = y * width + x;

            field.data[field_index] = (random() < threshold) ? 1 : 0;
        });

        const tAutomata = countTask(0, this.steps, index => {
            automata.step(field.data, field.width, field.height)
        });

        tAutomata.addDependency(tSeed);


        const action = this.action;

        const tInitializeAction = actionTask(() => {
            action.initialize(grid, seed);
        });

        const tWriteTags = countTask(0, width * grid.height, index => {
            const cellValue = field.data[index];

            const x = index % width;
            const y = (index / width) | 0;

            if (cellValue !== 0) {

                action.execute(grid, x, y, 0);

            }
        });

        tWriteTags.addDependency(tInitializeAction);
        tWriteTags.addDependency(tAutomata);

        return new TaskGroup([tInitializeAction, tSeed, tAutomata, tWriteTags]);
    }
}
