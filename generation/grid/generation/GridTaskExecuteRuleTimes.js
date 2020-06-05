import { GridTaskGenerator } from "../GridTaskGenerator.js";
import Task from "../../../core/process/task/Task.js";
import TaskSignal from "../../../core/process/task/TaskSignal.js";
import { BitSet } from "../../../core/binary/BitSet.js";
import { PI_HALF, randomIntegerBetween, seededRandom } from "../../../core/math/MathUtils.js";
import { actionTask } from "../../../core/process/task/TaskUtils.js";
import TaskGroup from "../../../core/process/task/TaskGroup.js";

export class GridTaskExecuteRuleTimes extends GridTaskGenerator {
    constructor() {
        super();

        /**
         *
         * @type {GridCellPlacementRule}
         */
        this.rule = null;

        this.count = 1;
    }

    /**
     *
     * @param {GridCellPlacementRule} rule
     * @param {number} [count=1]
     */
    static from(rule, count = 1) {
        const r = new GridTaskExecuteRuleTimes();

        r.rule = rule;
        r.count = count;

        return r;
    }

    build(grid, ecd, seed) {

        let completed = 0;

        const rule = this.rule;

        const count = this.count;

        const width = grid.width;
        const height = grid.height;

        const gridSize = height * width;
        const endIndex = gridSize - 1;

        /**
         *
         * @type {BitSet}
         */
        const closed = new BitSet();

        const random = seededRandom(seed);

        const tInitialize = actionTask(() => {
            this.rule.initialize(grid, seed);
        });

        const tMain = new Task({
            name: `Execute Rule ${count} times`,
            cycleFunction() {
                if (completed >= count) {
                    return TaskSignal.EndSuccess;
                }

                let index = randomIntegerBetween(random, 0, endIndex);

                let i = 0;

                while (closed.get(index)) {
                    index = (index + 1) % gridSize;

                    i++;

                    if (i >= endIndex) {
                        //we tried every cell, everything is taken
                        return TaskSignal.EndFailure;
                    }
                }

                const y = (index / width) | 0;
                const x = index % width;

                for (let j = 0; j < 4; j++) {

                    if (j > 0 && !rule.allowRotation) {
                        break;
                    }

                    const rotation = j * PI_HALF;

                    const isMatch = rule.pattern.match(grid, x, y, rotation);

                    if (isMatch) {
                        rule.execute(grid, x, y, rotation);

                        completed++;

                        break;
                    }

                }


                return TaskSignal.Continue;
            }
        });

        tMain.addDependency(tInitialize);

        return new TaskGroup([tInitialize, tMain]);
    }
}
