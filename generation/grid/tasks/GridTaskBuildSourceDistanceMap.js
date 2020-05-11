import { actionTask, countTask } from "../../../core/process/task/TaskUtils.js";
import Task from "../../../core/process/task/Task.js";
import { BitSet } from "../../../core/binary/BitSet.js";
import TaskGroup from "../../../core/process/task/TaskGroup.js";
import TaskSignal from "../../../core/process/task/TaskSignal.js";
import BinaryHeap from "../../../engine/navigation/grid/FastBinaryHeap.js";
import { GridTaskGenerator } from "../GridTaskGenerator.js";
import { assert } from "../../../core/assert.js";

/**
 * Build a map of distances across the grid, using 2 concepts: source cells and passable cells. Source cells are where the distance is 0, and passable cells are those that can be travelled through
 */
export class GridTaskBuildSourceDistanceMap extends GridTaskGenerator {
    constructor() {
        super();

        /**
         *
         * @type {GridCellMatcher}
         */
        this.sourceMatcher = null;

        /**
         *
         * @type {GridCellMatcher}
         */
        this.passMatcher = null;

        /**
         *
         * @type {number}
         */
        this.initial = 65535;
    }

    /**
     *
     * @param {GridCellMatcher} source
     * @param {GridCellMatcher} pass
     */
    static from(source, pass) {
        assert.defined(source);
        assert.defined(pass);

        const r = new GridTaskBuildSourceDistanceMap();

        r.sourceMatcher = source;
        r.passMatcher = pass;

        return r;
    }

    build(grid, ecd) {
        /**
         *
         * @type {GridCellMatcher}
         */
        const sourceMatcher = this.sourceMatcher;

        /**
         *
         * @type {GridCellMatcher}
         */
        const passMatcher = this.passMatcher;

        const initial = this.initial;

        const target = grid.startDistances;

        const open = new BinaryHeap(function (i) {
            return target[i];
        });

        /**
         *
         * @type {BitSet}
         */
        const closed = new BitSet();

        const width = grid.width;
        const height = grid.height;

        const tInitializeTarget = actionTask(() => {
            target.fill(initial);
        });

        //collect start cells
        const tCollectSources = countTask(0, width * height, index => {
            const y = (index / width) | 0;
            const x = index % width;

            const match = sourceMatcher.match(grid, x, y, 0);

            if (match) {
                open.push(index);

                //initialize target value
                target[index] = 0;
            }
        });

        tCollectSources.addDependency(tInitializeTarget);

        /**
         *
         * @param {number} iNeighbor
         * @param {number} iCurrent
         */
        function processNeighbor(iNeighbor, iCurrent) {

            //check if cell is passable
            const y = (iNeighbor / width) | 0;
            const x = iNeighbor % width;

            const isPassable = passMatcher.match(grid, x, y, 0);

            if (!isPassable) {
                //cell is an obstacle
                return;
            }

            if (closed.get(iNeighbor)) {
                //neighbour is already visited
                return;
            }

            const distance = target[iCurrent] + 1;

            const notInOpen = !open.contains(iNeighbor);

            if (notInOpen) {
                target[iNeighbor] = distance;
                open.push(iNeighbor);
            } else if (distance < target[iNeighbor]) {
                target[iNeighbor] = distance;
                open.rescoreElement(iNeighbor);
            }
        }

        const tMain = new Task({
            name: 'Build Distance Map',
            cycleFunction() {
                if (open.size() === 0) {
                    return TaskSignal.EndSuccess;
                }

                const currentIndex = open.pop();

                closed.set(currentIndex, true);

                //find neighbors
                const x = currentIndex % width;
                const y = (currentIndex / width) | 0;

                if (x > 0) {
                    //left
                    processNeighbor(currentIndex - 1, currentIndex);
                }

                if (x < width - 1) {
                    processNeighbor(currentIndex + 1, currentIndex);
                }

                if (y > 0) {
                    processNeighbor(currentIndex - width, currentIndex);
                }

                if (y < height - 1) {
                    processNeighbor(currentIndex + width, currentIndex);
                }

                return TaskSignal.Continue;
            }
        });

        tMain.addDependency(tCollectSources);

        return new TaskGroup([tInitializeTarget, tCollectSources, tMain]);
    }
}
