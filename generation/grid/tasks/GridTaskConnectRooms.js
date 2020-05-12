import { GridTaskGenerator } from "../GridTaskGenerator.js";
import { BitSet } from "../../../core/binary/BitSet.js";
import Task from "../../../core/process/task/Task.js";
import TaskSignal from "../../../core/process/task/TaskSignal.js";
import Vector2 from "../../../core/geom/Vector2.js";
import BinaryHeap from "../../../engine/navigation/grid/FastBinaryHeap.js";
import { passThrough } from "../../../core/function/Functions.js";
import { GridCellActionPlaceTags } from "../../placement/GridCellActionPlaceTags.js";
import { GridTags } from "../../GridTags.js";
import TaskGroup from "../../../core/process/task/TaskGroup.js";

/**
 * Algorithm works in the following steps:
 * 1) keep a closed set of tiles, these are the tiles that are "connected"
 * 2) find an empty tile by scanning, add it to closed set
 * 3) find the entire room connected to that tile using flood-fill
 * 4) flood fill the area around the room to find the closest unconnected room
 * 5) perform the connection, expand the "connected" room and repeat steps from 3
 */
export class GridTaskConnectRooms extends GridTaskGenerator {
    constructor() {
        super();

        /**
         * Matches a room tile
         * @type {CellMatcher}
         */
        this.matcher = null;

        /**
         *
         * @type {number[]}
         */
        this.neighbourhoodMask = [
            0, -1,
            -1, 0,
            1, 0,
            0, 1
        ];

        /**
         * Actions to perform on created corridors
         * @type {GridCellAction[]}
         */
        this.actions = [
            GridCellActionPlaceTags.from(GridTags.Traversable)
        ];
    }

    /**
     *
     * @param {CellMatcher} matcher
     * @returns {GridTaskConnectRooms}
     */
    static from(matcher) {
        const r = new GridTaskConnectRooms();
        r.matcher = matcher;
        return r;
    }

    /**
     *
     * @param {GridData} grid
     * @param {Vector2} result
     * @returns {Task}
     */
    findEmptyTile(grid, result) {
        const matcher = this.matcher;

        let i = 0;

        const width = grid.width;

        const gridSize = grid.width * grid.height;

        return new Task({
            cycleFunction() {
                if (i >= gridSize) {
                    //not found
                    return TaskSignal.EndFailure;
                }

                const x = i % width;
                const y = (i / width) | 0;

                if (matcher.match(grid, x, y, 0)) {
                    result.set(x, y);

                    return TaskSignal.EndSuccess;
                }

                i++;

                return TaskSignal.Continue;
            },
            computeProgress() {
                return i / gridSize;
            },
            estimatedDuration: gridSize
        });
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {GridData} grid
     * @param {BitSet} connected
     */
    fillConnectedArea(x, y, grid, connected) {
        const open = new BinaryHeap(passThrough);

        const width = grid.width;
        const initialIndex = x + y * width;

        open.push(initialIndex);

        const neighbourhoodMask = this.neighbourhoodMask;
        const neighbourhoodMaskSize = neighbourhoodMask.length;

        const closed = new BitSet();

        while (open.size() > 0) {

            const current = open.pop();

            closed.set(current, true);

            connected.set(current, true);

            const c_x = current % width;
            const c_y = (current / width) | 0;

            for (let i = 0; i < neighbourhoodMaskSize; i += 2) {

                const local_nx = neighbourhoodMask[i];
                const local_ny = neighbourhoodMask[i + 1];

                const n_x = local_nx + c_x;

                if (n_x < 0 || n_x >= width) {
                    continue;
                }

                const n_y = local_ny + c_y;

                if (n_y < 0 || n_y >= grid.height) {
                    continue;
                }

                const neighbour_index = n_x + n_y * width;

                if (closed.get(neighbour_index)) {
                    continue;
                }

                const isMatch = this.matcher.match(grid, n_x, n_y, 0);

                if (!isMatch) {
                    continue;
                }

                const isInOpen = open.contains(neighbour_index);

                if (!isInOpen) {
                    open.push(neighbour_index);
                }
            }
        }
    }

    /**
     *
     * @param {Vector2} result
     * @param {Uint16Array} distances
     * @param {GridData} grid
     * @param {BitSet} connected
     * @returns {boolean}
     */
    findNearestUnconnectedRoom(result, distances, grid, connected) {

        const width = grid.width;
        const height = grid.height;


        const neighbourhoodMask = this.neighbourhoodMask;
        const neighbourhoodMaskSize = neighbourhoodMask.length;

        distances.fill(65535);

        const open = new BinaryHeap(i => distances[i]);

        const closed = new BitSet();


        //first we need to build an open set, this will be all the non-matching neighbours to connected set
        for (let current = connected.nextSetBit(0); current !== -1; current = connected.nextSetBit(current + 1)) {

            distances[current] = 0;
            closed.set(current, true);

            const c_x = current % width;
            const c_y = (current / width) | 0;

            for (let j = 0; j < neighbourhoodMaskSize; j += 2) {

                const local_nx = neighbourhoodMask[j];
                const local_ny = neighbourhoodMask[j + 1];

                const n_x = local_nx + c_x;

                if (n_x < 0 || n_x >= width) {
                    continue;
                }

                const n_y = local_ny + c_y;

                if (n_y < 0 || n_y >= height) {
                    continue;
                }

                const neighbour_index = n_x + n_y * width;

                if (closed.get(neighbour_index)) {
                    continue;
                }

                const isMatch = this.matcher.match(grid, n_x, n_y, 0);

                if (isMatch) {
                    continue;
                }

                const isInOpen = open.contains(neighbour_index);

                if (!isInOpen) {
                    open.push(neighbour_index);

                    distances[neighbour_index] = 1;
                }
            }
        }


        //we now have outline of the connected area in the open set, we can proceed to flood-fill the grid until we find a room cell
        while (open.size() > 0) {

            const current = open.pop();

            closed.set(current, true);

            connected.set(current, true);

            const c_x = current % width;
            const c_y = (current / width) | 0;

            for (let i = 0; i < neighbourhoodMaskSize; i += 2) {

                const local_nx = neighbourhoodMask[i];
                const local_ny = neighbourhoodMask[i + 1];

                const n_x = local_nx + c_x;

                if (n_x < 0 || n_x >= width) {
                    continue;
                }

                const n_y = local_ny + c_y;

                if (n_y < 0 || n_y >= grid.height) {
                    continue;
                }

                const neighbour_index = n_x + n_y * width;

                if (closed.get(neighbour_index)) {
                    continue;
                }

                const isMatch = this.matcher.match(grid, n_x, n_y, 0);

                const distance = distances[current] + 1;

                const isInOpen = open.contains(neighbour_index);

                if (!isInOpen) {

                    open.push(neighbour_index);
                    distances[neighbour_index] = distance;

                } else if (distance < distances[neighbour_index]) {

                    distances[neighbour_index] = distances;
                    open.rescoreElement(neighbour_index);

                }

                if (isMatch) {
                    result.set(n_x, n_y);

                    return true;
                }
            }
        }

        //connection not found
        return false;
    }

    /**
     * Connect a given point via a corridor of a given width
     * @param {number} x
     * @param {number} y
     * @param {number} thickness
     * @param {GridData} grid
     * @param {Uint16Array} distances
     * @param {BitSet} connected
     */
    connectPoint(x, y, thickness, grid, distances, connected) {
        const width = grid.width;
        const height = grid.height;

        let index = x + y * width;

        const actions = this.actions;
        const actionCount = actions.length;

        const neighbourhoodMask = this.neighbourhoodMask;
        const neighbourhoodMaskSize = neighbourhoodMask.length;

        const thickness_2 = Math.floor(thickness / 2);

        const path = [];

        while (distances[index] >= 0 && index !== -1) {

            path.push(index);

            const c_x = index % width;
            const c_y = (index / width) | 0;

            //paint a section of tunnel
            for (let _y = -thickness_2; _y < thickness_2; _y++) {
                const t_y = c_y + _y;

                if (t_y < 0 || t_y >= height) {
                    continue;
                }

                for (let _x = -thickness_2; _x < thickness_2; _x++) {
                    const t_x = c_x + _x;

                    if (t_x < 0 || t_x >= width) {
                        continue;
                    }

                    const t_index = t_y * width + t_x;

                    if (connected.get(t_index)) {
                        //already connected
                        continue;
                    }

                    connected.set(t_index, true);

                    for (let action_index = 0; action_index < actionCount; action_index++) {
                        const action = actions[action_index];

                        action.execute(grid, t_x, t_y, 0);
                    }
                }
            }

            //pick next index

            let bestNext = -1;
            let bestDistance = distances[index];

            for (let i = 0; i < neighbourhoodMaskSize; i += 2) {

                const local_nx = neighbourhoodMask[i];
                const local_ny = neighbourhoodMask[i + 1];

                const n_x = local_nx + c_x;

                if (n_x < 0 || n_x >= width) {
                    continue;
                }

                const n_y = local_ny + c_y;

                if (n_y < 0 || n_y >= height) {
                    continue;
                }

                const neighbour_index = n_x + n_y * width;

                const distance = distances[neighbour_index];

                if (distance < bestDistance) {
                    bestNext = neighbour_index;
                    bestDistance = distance;
                }
            }

            index = bestNext;
        }

        console.log('Path: ', path.map(i => {
            return [
                i % width,
                (i / width) | 0
            ];
        }).join(', '));
    }

    build(grid, ecd) {

        const connected = new BitSet();

        const gridSize = grid.width * grid.height;
        const distances = new Uint16Array(gridSize);

        const start = new Vector2();

        //find a first empty tile
        const tFindStart = this.findEmptyTile(grid, start);


        const tMain = new Task({
            cycleFunction: () => {
                this.fillConnectedArea(start.x, start.y, grid, connected);

                const found = this.findNearestUnconnectedRoom(start, distances, grid, connected);

                if (!found) {
                    return TaskSignal.EndSuccess;
                }

                this.connectPoint(start.x, start.y, 5, grid, distances, connected);

                return TaskSignal.Continue;
            }
        });

        tMain.addDependency(tFindStart);

        return new TaskGroup([tFindStart, tMain]);
    }
}
