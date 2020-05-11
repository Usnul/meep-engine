import { GridTaskGenerator } from "../GridTaskGenerator.js";
import Task from "../../../core/process/task/Task.js";
import TaskSignal from "../../../core/process/task/TaskSignal.js";
import { BitSet } from "../../../core/binary/BitSet.js";
import { randomIntegerBetween, seededRandom } from "../../../core/math/MathUtils.js";

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

    build(grid, ecd) {

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

        const random = seededRandom(this.randomSeed);

        return new Task({
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

                const isMatch = rule.pattern.match(grid, x, y, 0);

                if (isMatch) {
                    rule.execute(grid, x, y, 0);

                    completed++;
                }

                return TaskSignal.Continue;
            }
        });
    }
}
