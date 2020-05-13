import { GridTaskGenerator } from "../GridTaskGenerator.js";
import { actionTask, countTask } from "../../../core/process/task/TaskUtils.js";
import TaskGroup from "../../../core/process/task/TaskGroup.js";
import Graph from "../../../core/graph/Graph.js";
import { buildDistanceMapToObjective } from "./util/buildDistanceMapToObjective.js";
import Vector2 from "../../../core/geom/Vector2.js";
import BinaryHeap from "../../../engine/navigation/grid/FastBinaryHeap.js";
import { BitSet } from "../../../core/binary/BitSet.js";
import { matcher_tag_traversable } from "../../example/rules/matcher_tag_traversable.js";
import { buildPathFromDistanceMap } from "./util/buildPathFromDistanceMap.js";
import { inverseLerp, lerp, seededRandom } from "../../../core/math/MathUtils.js";
import { GridCellActionPlaceTags } from "../../placement/GridCellActionPlaceTags.js";
import { GridTags } from "../../GridTags.js";
import { GridCellRuleContainsMarkerTypeWithinRadius } from "../../rules/cell/GridCellRuleContainsMarkerTypeWithinRadius.js";
import { CellMatcher } from "../../rules/CellMatcher.js";
import { CellMatcherAnd } from "../../rules/CellMatcherAnd.js";
import { randomizeArrayElementOrder } from "../../../core/collection/ArrayUtils.js";

const NODE_TYPE_ROAD_CONNECTOR = 'Road Connector';

export class GridTaskGenerateRoads extends GridTaskGenerator {
    constructor() {
        super();

        /**
         * Vertices are things that are to be connected
         * @type {CellMatcher}
         */
        this.vertex = null;

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
            1, -1,
            0, -1,

            -1, 0,
            1, 0,

            0, 1,
            -1, 1,
            1, 1
        ];

        /**
         * Actions to perform on created roads
         * @type {GridCellAction[]}
         */
        this.actions = [
            GridCellActionPlaceTags.from(GridTags.Road)
        ];
    }

    /**
     * TODO add post-processing step to merge various paths
     */
    build(grid, ecd) {
        /**
         *
         * @type {MarkerNode[]}
         */
        const connectorNodes = [];

        /**
         *
         * @type {Graph<MarkerNode>}
         */
        const graph = new Graph();

        const width = grid.width;
        const height = grid.height;

        const distances = new Uint16Array(width * height);

        const traversable = matcher_tag_traversable;

        //collect all goad connector nodes
        const tCollectConnectors = actionTask(() => {
            grid.markers.traverseData(datum => {
                /**
                 *
                 * @type {MarkerNode}
                 */
                const node = datum.data;

                if (node.type === NODE_TYPE_ROAD_CONNECTOR) {
                    connectorNodes.push(node);

                    graph.addNode(node);
                }
            });
        });


        const tRandomizeOrder = actionTask(() => {
            const random = seededRandom(this.randomSeed);
            randomizeArrayElementOrder(connectorNodes, random);
        }, 'randomize node order');
        tRandomizeOrder.addDependency(tCollectConnectors);

        const connectorMatcher = GridCellRuleContainsMarkerTypeWithinRadius.from(NODE_TYPE_ROAD_CONNECTOR, 0.5);


        /**
         *
         * @param {number} x
         * @param {number} y
         * @returns {MarkerNode|undefined}
         */
        function getNodeAtPosition(x, y) {
            const n = connectorNodes.length;
            for (let i = 0; i < n; i++) {
                const node = connectorNodes[i];

                if (node.position.x === x && node.position.y === y) {
                    return node;
                }
            }

            return undefined;
        }

        const connected = [];

        const tBuildConnections = countTask(
            0,
            () => connectorNodes.length,
            index => {

                const startNode = connectorNodes[index];

                if (connected.indexOf(startNode) !== -1) {
                    //already connected
                    return;
                }

                distances.fill(65535);

                const target = new Vector2();

                const open = new BinaryHeap(i => distances[i]);

                const startIndex = startNode.position.x + startNode.position.y * width;

                distances[startIndex] = 0;

                open.push(startIndex);

                const closed = new BitSet();

                const excludeConnected = new CellMatcher();

                const connectedCount = connected.length;

                excludeConnected.match = (grid, x, y) => {

                    for (let i = 0; i < connectedCount; i++) {
                        const markerNode = connected[i];

                        if (markerNode.position.x === x && markerNode.position.y === y) {
                            return false;
                        }
                    }

                    return true;
                };

                //build distance map
                const found = buildDistanceMapToObjective({
                    result: target,
                    distances,
                    open,
                    closed,
                    grid,
                    traversable: traversable,
                    objective: CellMatcherAnd.from(connectorMatcher, excludeConnected),
                    neighbourhoodMask: this.neighbourhoodSearchMask
                });

                if (!found) {
                    return;
                }

                //TODO nudge path towards open areas using a distance field
                const path = buildPathFromDistanceMap({
                    distances,
                    grid,
                    x: target.x,
                    y: target.y,
                    neighbourhoodMask: this.neighbourhoodDrawMask
                });

                const endNode = getNodeAtPosition(target.x, target.y);

                if (graph.isEdgeBetween(startNode, endNode)) {
                    //already connected
                    return;
                }

                const edge = graph.createEdge(startNode, endNode);

                edge.path = path;

                if (connected.indexOf(startNode) === -1) {
                    connected.push(startNode);
                }
                if (connected.indexOf(endNode) === -1) {
                    connected.push(endNode);
                }
            }
        );

        tBuildConnections.addDependency(tRandomizeOrder);

        const tDrawConnections = countTask(
            0,
            () => graph.edges.length,
            index => {
                /**
                 *
                 * @type {Edge<MarkerNode>}
                 */
                const edge = graph.edges[index];

                const path = edge.path;

                const n = path.length;

                const sourceNode = edge.first;
                const targetNode = edge.second;

                const sourceThickness = sourceNode.properties.thickness || 1;
                const targetThickness = targetNode.properties.thickness || 1;

                const actions = this.actions;
                const actionCount = actions.length;

                for (let i = 0; i < n; i++) {
                    const index = path[i];

                    const f = inverseLerp(0, n, i);
                    const thickness = lerp(sourceThickness, targetThickness, f);

                    const thickness_0 = Math.floor(thickness / 2);
                    const thickness_1 = Math.ceil(thickness / 2);

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


                            //check if we can actually dig through
                            if (!traversable.match(grid, t_x, t_y, 0)) {
                                continue;
                            }

                            for (let action_index = 0; action_index < actionCount; action_index++) {
                                const action = actions[action_index];

                                action.execute(grid, t_x, t_y, 0);
                            }
                        }
                    }

                }
            }
        );

        tDrawConnections.addDependency(tBuildConnections);

        return new TaskGroup([
            tCollectConnectors,
            tRandomizeOrder,
            tBuildConnections,
            tDrawConnections
        ]);
    }
}
