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
import { Sampler2D } from "../../../engine/graphics/texture/sampler/Sampler2D.js";
import { bitSet2Sampler2D } from "../../../engine/graphics/texture/sampler/util/bitSet2Sampler2D.js";
import { min2 } from "../../../core/math/MathUtils.js";
import { drawSamplerHTML } from "../../../engine/graphics/texture/sampler/util/drawSamplerHTML.js";
import { matcher_tag_unoccupied } from "../../example/rules/matcher_tag_unoccupied.js";
import { buildDistanceMapToObjective } from "./util/buildDistanceMapToObjective.js";
import { buildPathFromDistanceMap } from "./util/buildPathFromDistanceMap.js";

const ESTIMATED_TILES_PER_ROOM = 900;

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
         * Matches tiles that can be tunneled through
         * @type {CellMatcher}
         */
        this.modifiable = matcher_tag_unoccupied;

        /**
         *
         * @type {number[]}
         */
        this.neighbourhoodSearchMask = [
            0, -1,

            -1, 0,
            1, 0,

            0, 1,
        ];

        /**
         *
         * @type {number[]}
         */
        this.neighbourhoodDrawMask = [
            -1, -1,
            0, -1,
            1, -1,

            -1, 0,
            1, 0,

            -1, 1,
            0, 1,
            1, 1
        ];

        this.thickness = 3;

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
            estimatedDuration: gridSize / 10000
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

        const neighbourhoodMask = this.neighbourhoodSearchMask;
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


        const neighbourhoodMask = this.neighbourhoodSearchMask;
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

                if (connected.get(neighbour_index)) {
                    //not part of the outside
                    continue;
                }

                const isMatch = this.matcher.match(grid, n_x, n_y, 0);

                if (isMatch) {
                    continue;
                }

                //check if the neighbour can be tunneled through
                const canTunnel = this.modifiable.match(grid, n_x, n_y, 0);

                if (!canTunnel) {
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
        return buildDistanceMapToObjective({
            result,
            open,
            closed,
            distances,
            grid,
            neighbourhoodMask,
            traversable: this.modifiable,
            objective: this.matcher
        });
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

        const actions = this.actions;
        const actionCount = actions.length;

        const neighbourhoodMask = this.neighbourhoodDrawMask;

        const thickness_0 = Math.floor(thickness / 2);
        const thickness_1 = Math.ceil(thickness / 2);

        const path = buildPathFromDistanceMap({
            distances,
            width: width,
            height: height,
            x,
            y,
            neighbourhoodMask
        });

        const n = path.length;

        for (let i = 0; i < n; i++) {
            const index = path[i];

            const c_x = index % width;
            const c_y = (index / width) | 0;

            //paint a section of tunnel
            for (let _y = -thickness_0; _y < thickness_1; _y++) {
                const t_y = c_y + _y;

                if (t_y < 0 || t_y >= height) {
                    continue;
                }

                for (let _x = -thickness_0; _x < thickness_1; _x++) {
                    const t_x = c_x + _x;

                    if (t_x < 0 || t_x >= width) {
                        continue;
                    }

                    const t_index = t_y * width + t_x;

                    if (connected.get(t_index)) {
                        //already connected
                        continue;
                    }

                    //check if we can actually dig through
                    if (!this.modifiable.match(grid, t_x, t_y, 0)) {
                        continue;
                    }

                    connected.set(t_index, true);

                    for (let action_index = 0; action_index < actionCount; action_index++) {
                        const action = actions[action_index];

                        action.execute(grid, t_x, t_y, 0);
                    }
                }
            }

        }

        // console.log('Path: ', path.map(i => {
        //     return [
        //         i % width,
        //         (i / width) | 0
        //     ];
        // }).join(', '));
    }

    /**
     *
     * @param {GridData} grid
     * @param {number[]} points
     * @param {BitSet} connected
     * @param {number[]} distances
     * @returns {Sampler2D}
     */
    debugState(grid, points, connected, distances) {
        const result = Sampler2D.uint8(3, grid.width, grid.height);

        //first write connectedness
        bitSet2Sampler2D(connected, result, [255, 0, 0], [0, 0, 0]);

        //write points into blue channel
        for (let i = 0; i < points.length; i += 2) {
            const x = points[i];
            const y = points[i + 1];

            result.writeChannel(x, y, 1, 255);
        }

        //write distances into green channel
        const gridSize = result.width * result.height;
        for (let i = 0; i < gridSize; i++) {
            const distance = distances[i];

            const v = min2(distance * 10, 255);

            result.data[i * result.itemSize + 2] = v;
        }

        return result;
    }

    /**
     *
     * @param {number} iteration
     * @param {GridData} grid
     * @param {number[]} points
     * @param {BitSet} connected
     * @param {number[]} distances
     */
    drawDebugState(iteration, grid, points, connected, distances) {

        const d = this.debugState(grid, points, connected, distances);

        const y = (iteration / 4) | 0;
        const x = iteration % 4;

        drawSamplerHTML(document.body, d, x * 260 + 5, y * 260 + 5, 1, 0, 256);

    }

    build(grid, ecd) {

        const connected = new BitSet();

        const gridSize = grid.width * grid.height;
        const distances = new Uint16Array(gridSize);

        const start = new Vector2();

        //find a first empty tile
        const tFindStart = this.findEmptyTile(grid, start);

        const thickness = this.thickness;
        let i = 0;

        const estimatedNumberOfRooms = gridSize / ESTIMATED_TILES_PER_ROOM;

        const tMain = new Task({
            cycleFunction: () => {

                this.fillConnectedArea(start.x, start.y, grid, connected);

                const found = this.findNearestUnconnectedRoom(start, distances, grid, connected);

                if (!found) {
                    return TaskSignal.EndSuccess;
                }

                this.connectPoint(start.x, start.y, thickness, grid, distances, connected);

                // this.drawDebugState(i, grid, [start.x, start.y], connected, distances);

                i++;

                return TaskSignal.Continue;
            },
            estimatedDuration: gridSize / 10000,
            computeProgress() {

                const p = i / estimatedNumberOfRooms;

                if (Number.isNaN(p)) {
                    return 0;
                } else if (p > 1) {
                    return 1;
                } else {
                    return p;
                }

            }
        });

        tMain.addDependency(tFindStart);

        return new TaskGroup([tFindStart, tMain]);
        // return new TaskGroup([emptyTask()]);
    }
}
