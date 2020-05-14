import { GridTaskGenerator } from "../../GridTaskGenerator.js";
import { actionTask, countTask } from "../../../../core/process/task/TaskUtils.js";
import TaskGroup from "../../../../core/process/task/TaskGroup.js";
import Graph from "../../../../core/graph/Graph.js";
import BinaryHeap from "../../../../engine/navigation/grid/FastBinaryHeap.js";
import { BitSet } from "../../../../core/binary/BitSet.js";
import { matcher_tag_traversable } from "../../../example/rules/matcher_tag_traversable.js";
import { buildPathFromDistanceMap } from "../util/buildPathFromDistanceMap.js";
import { inverseLerp, lerp } from "../../../../core/math/MathUtils.js";
import { GridCellActionPlaceTags } from "../../../placement/GridCellActionPlaceTags.js";
import { GridTags } from "../../../GridTags.js";
import { CellMatcher } from "../../../rules/CellMatcher.js";
import { groupArrayBy } from "../../../../core/collection/ArrayUtils.js";
import { Sampler2D } from "../../../../engine/graphics/texture/sampler/Sampler2D.js";
import { ParameterLookupTable } from "../../../../engine/graphics/particles/particular/engine/parameter/ParameterLookupTable.js";
import { obtainTerrain } from "../../../../../model/game/scenes/SceneUtils.js";
import { paintTerrainOverlayViaLookupTable } from "../../../../engine/ecs/terrain/util/paintTerrainOverlayViaLookupTable.js";
import { NumericInterval } from "../../../../core/math/interval/NumericInterval.js";
import { collectIteratorValueToArray } from "../../../../core/collection/IteratorUtils.js";
import { QuadTreeNode } from "../../../../core/geom/2d/quad-tree/QuadTreeNode.js";
import AABB2 from "../../../../core/geom/AABB2.js";
import { PathEndPoint } from "./PathEndPoint.js";
import { Path } from "./Path.js";
import { readMarkerNodeGroupId } from "./readMarkerNodeGroupId.js";

const NODE_TYPE_ROAD_CONNECTOR = 'Road Connector';


/**
 *
 * @param {QuadTreeNode} tree
 * @param {Path} path
 * @param {number} gridWidth
 */
function addPathToQuadTree(tree, path, gridWidth) {
    const bounds = new AABB2();

    path.computeBounds(bounds, gridWidth);

    tree.add(path, bounds.x0, bounds.y0, bounds.x1, bounds.y1);
}

/**
 *
 * @param {MarkerNode[]} array
 * @param {number} x
 * @param {number} y
 * @returns {MarkerNode|undefined}
 */
function findMarkerNodeByPosition(array, x, y) {
    const n = array.length;
    for (let i = 0; i < n; i++) {
        const node = array[i];

        if (node.position.x === x && node.position.y === y) {
            return node;
        }
    }

    return undefined;
}


/**
 * @param {number[]} distances
 * @param {number} width
 * @param {number} height
 * @param {number} n_x
 * @param {number} n_y
 * @param {number[]} neighbourhoodMask
 * @param {MarkerNode[]} group
 * @param {PathEndPoint} targetEndpoint
 * @param {QuadTreeNode<Path>} pathIndex
 */
function createPathToTargetEndpoint(distances, width, height, n_x, n_y, neighbourhoodMask, group, targetEndpoint, pathIndex) {
    //lets connect to this path
    const pathIndices = buildPathFromDistanceMap({
        distances,
        width,
        height,
        x: n_x,
        y: n_y,
        neighbourhoodMask
    });

    const sourceGridIndex = pathIndices[pathIndices.length - 1];

    const source_x = sourceGridIndex % width;
    const source_y = (sourceGridIndex / width) | 0;

    const sourceNode = findMarkerNodeByPosition(group, source_x, source_y);

    const sourceEndpoint = PathEndPoint.fromNode(sourceNode);


    const path = Path.from(targetEndpoint, sourceEndpoint, pathIndices);

    addPathToQuadTree(pathIndex, path, width);
}

/**
 *
 * @param {MarkerNode[]} nodes
 * @param {number[]} distances
 * @param {number[]} ignore Which groups to ignore
 * @param {number[]} neighbourhoodMask
 * @param {GridData} grid
 * @param {CellMatcher} traversable
 * @param {Path[]} result
 * @returns {TaskGroup}
 */
function buildPaths(
    {
        result,
        nodes,
        distances,
        neighbourhoodMask,
        grid,
        traversable
    }
) {

    const width = grid.width;
    const height = grid.height;

    const neighbourhoodMaskSize = neighbourhoodMask.length;

    const open = new BinaryHeap(i => distances[i]);

    const closed = new BitSet();


    /**
     *
     * @type {QuadTreeNode<MarkerNode>}
     */
    const nodeIndex = new QuadTreeNode();

    /**
     *
     * @type {QuadTreeNode<Path>}
     */
    const pathIndex = new QuadTreeNode();

    //add nodes to the index
    const tBuildNodeIndex = countTask(0, () => nodes.length, i => {

        const node = nodes[i];

        const x = node.position.x;
        const y = node.position.y;

        nodeIndex.add(node, x, y, x, y);
    });


    /**
     *
     * @type {MarkerNode[][]}
     */
    const groupArray = [];

    const tBuildNodeGroups = actionTask(() => {

        //group nodes
        const groupMap = groupArrayBy(nodes, readMarkerNodeGroupId);

        /**
         *
         * @type {IterableIterator<MarkerNode[]>}
         */
        const groupValueIterator = groupMap.values();

        collectIteratorValueToArray(groupArray, groupValueIterator);
    }, 'Build Groups');


    const tBuildPaths = countTask(0, () => groupArray.length, i => {

        /**
         *
         * @type {MarkerNode[]}
         */
        const group = groupArray[i];

        const groupSize = group.length;

        distances.fill(65535);

        open.clear();
        closed.reset();

        //populate the open set with all connectors from the group
        for (let j = 0; j < groupSize; j++) {
            const node = group[j];

            const x = node.position.x;
            const y = node.position.y;

            if (!traversable.match(grid, x, y, 0)) {
                //connector is non-traversable
                continue;
            }

            const index = x + y * width;

            open.push(index);

            distances[index] = 0;
        }

        const groupId = readMarkerNodeGroupId(group[0]);

        /**
         *
         * @type {QuadTreeDatum<Path>[]}
         */
        const tempArrayPath = [];

        /**
         *
         * @type {QuadTreeDatum<MarkerNode>[]}
         */
        const tempArrayNode = [];

        while (open.size() > 0) {

            const current = open.pop();

            closed.set(current, true);

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

                //check if the cell can be traversed
                if (!traversable.match(grid, n_x, n_y, 0)) {
                    //not traversable
                    continue;
                }


                const distance = distances[current] + 1;

                const isInOpen = open.contains(neighbour_index);

                if (!isInOpen) {

                    open.push(neighbour_index);
                    distances[neighbour_index] = distance;

                } else if (distance < distances[neighbour_index]) {

                    distances[neighbour_index] = distances;
                    open.rescoreElement(neighbour_index);

                }

                //check if tile is a road
                const q_x0 = n_x - 0.1;
                const q_y0 = n_y - 0.1;
                const q_x1 = n_x + 0.1;
                const q_y1 = n_y + 0.1;

                const pathIntersections = pathIndex.requestDatumIntersectionsRectangle(tempArrayPath, q_x0, q_y0, q_x1, q_y1);

                for (let j = 0; j < pathIntersections; j++) {
                    const encounteredPathDatum = tempArrayPath[j];

                    /**
                     *
                     * @type {Path}
                     */
                    const encounteredPath = encounteredPathDatum.data;

                    if (encounteredPath.test(neighbour_index)) {
                        //we encountered a path

                        if (encounteredPath.isAttachedToMarkerGroup(groupId)) {
                            //attached to the same group, don't connect to this path
                            continue;
                        }

                        const targetEndpoint = PathEndPoint.fromPath(n_x, n_y, encounteredPath);

                        createPathToTargetEndpoint(distances, width, height, n_x, n_y, neighbourhoodMask, group, targetEndpoint, pathIndex);

                        return;
                    }

                }

                //check if tile is another connector node
                const nodeIntersections = nodeIndex.requestDatumIntersectionsRectangle(tempArrayNode, q_x0, q_y0, q_x1, q_y1);

                if (nodeIntersections > 0) {
                    //pick first one, ignore multiple overlapping nodes

                    /**
                     *
                     * @type {QuadTreeDatum<MarkerNode>}
                     */
                    const targetNodeDatum = tempArrayNode[0];

                    /**
                     *
                     * @type {MarkerNode}
                     */
                    const targetNode = targetNodeDatum.data;

                    const targetEndpoint = PathEndPoint.fromNode(targetNode);

                    createPathToTargetEndpoint(distances, width, height, n_x, n_y, neighbourhoodMask, group, targetEndpoint, pathIndex);

                    return;
                }
            }
        }
    });

    tBuildPaths.addDependency(tBuildNodeGroups);
    tBuildPaths.addDependency(tBuildNodeIndex);

    const tCollectPaths = actionTask(() => pathIndex.getRawData(result), 'collect paths');

    tCollectPaths.addDependency(tBuildPaths);

    return new TaskGroup([tBuildNodeGroups, tBuildNodeIndex, tBuildPaths, tCollectPaths], 'Building Paths');
}


/**
 * Connectivity map fill out all available space with shortest distances to a node index
 * @param {GridData} grid
 * @param {number[]} indices
 * @param {number[]} distances
 * @param {MarkerNode[]} nodes
 * @param {CellMatcher} traversable
 * @param {number[]} neighbourhoodMask
 */
function buildConnectivityMap(
    {
        grid,
        indices,
        distances,
        nodes,
        traversable,
        neighbourhoodMask
    }
) {
    distances.fill(65535);

    const width = grid.width;

    const open = new BinaryHeap(i => distances[i]);

    const closed = new BitSet();

    //add all nodes to open set
    const n = nodes.length;
    for (let i = 0; i < n; i++) {
        const node = nodes[i];

        const properties = node.properties;

        const position = node.position;

        const x = position.x;
        const y = position.y;

        //check if the node can be traversed
        if (!traversable.match(grid, x, y, 0)) {
            //not traversable, connector is basically invalid, we ignore it
            continue;
        }

        const index = x + y * width;

        distances[index] = 0;
        indices[index] = properties.groupId;

        open.push(index);
    }


    const neighbourhoodMaskSize = neighbourhoodMask.length;

    while (open.size() > 0) {
        const current = open.pop();

        closed.set(current, true);

        const c_x = current % width;
        const c_y = (current / width) | 0;

        const neighbourDistance = distances[current] + 1;
        const group = indices[current];

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

            //check if the cell can be traversed
            if (!traversable.match(grid, n_x, n_y, 0)) {
                //not traversable
                continue;
            }


            const isInOpen = open.contains(neighbour_index);

            if (!isInOpen) {

                open.push(neighbour_index);
                distances[neighbour_index] = neighbourDistance;

                indices[neighbour_index] = group;

            } else if (neighbourDistance < distances[neighbour_index]) {

                distances[neighbour_index] = distances;
                open.rescoreElement(neighbour_index);

                indices[neighbour_index] = group;

            }
        }

    }
}

/**
 *
 * @param {Path} path
 * @param {GridCellAction} actions
 * @param {CellMatcher} traversable
 * @param {GridData} grid
 */
function drawPath(path, actions, traversable, grid) {
    const width = grid.width;
    const height = grid.height;

    const pathIndices = path.indices;
    const n = pathIndices.length;

    const sourceThickness = 1;
    const targetThickness = 1;

    const actionCount = actions.length;

    for (let i = 0; i < n; i++) {
        const index = pathIndices[i];

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

            0, 1
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

        const gridSize = width * height;
        const distances = new Uint16Array(gridSize);

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

        const tBuildConnectivity = actionTask(() => {
            const indices = new Uint16Array(gridSize);

            indices.fill(65535);

            buildConnectivityMap({
                grid,
                distances,
                indices,
                nodes: connectorNodes,
                traversable: traversable,
                neighbourhoodMask: this.neighbourhoodSearchMask
            });


            const sDistances = new Sampler2D(distances, 1, grid.width, grid.height);


            const heatmap_lut = new ParameterLookupTable(4);

            heatmap_lut.write([
                // 0, 0, 0, 100,
                0, 0, 255, 100,
                0, 179, 179, 100,
                0, 255, 0, 100,
                255, 255, 0, 100,
                255, 0, 0, 100,
                255, 0, 255, 100,
                255, 255, 255, 10
            ]);

            heatmap_lut.computeUniformPositions();

            const terrain = obtainTerrain(ecd);

            paintTerrainOverlayViaLookupTable({
                overlay: terrain.overlay,
                sampler: sDistances,
                range: new NumericInterval(0, 10),
                lut: heatmap_lut
            });
        });

        const paths = [];

        const tBuildPaths = buildPaths({
            result: paths,
            nodes: connectorNodes,
            distances,
            neighbourhoodMask: this.neighbourhoodSearchMask,
            grid,
            traversable
        });

        tBuildPaths.addDependency(tCollectConnectors);

        const tDrawPaths = countTask(0, () => paths.length, i => {

            const path = paths[i];

            drawPath(path, this.actions, traversable, grid);
        });

        tDrawPaths.addDependency(tBuildPaths);


        return new TaskGroup([
            tCollectConnectors,
            tBuildPaths,
            tDrawPaths
        ]);
    }
}
