import Graph from "../../../../../core/graph/Graph.js";
import { QuadTreeNode } from "../../../../../core/geom/2d/quad-tree/QuadTreeNode.js";
import { BitSet } from "../../../../../core/binary/BitSet.js";
import { SplatMapMaterialPatch } from "./SplatMapMaterialPatch.js";
import { colorizeGraphGreedyWeight } from "../../../../../core/graph/coloring/colorizeGraphGreedyWeight.js";
import { validateGraphColoring } from "../../../../../core/graph/coloring/validateGraphColoring.js";
import ConcurrentExecutor from "../../../../../core/process/executor/ConcurrentExecutor.js";
import Task from "../../../../../core/process/task/Task.js";
import { actionTask, countTask } from "../../../../../core/process/task/TaskUtils.js";
import TaskSignal from "../../../../../core/process/task/TaskSignal.js";

/**
 * We convert splat mapping into a graph of connecting material patches and solve the overlaps as a "Graph Coloring" problem
 */
export class SplatMapOptimizer {
    constructor() {
        /**
         *
         * @type {Graph<SplatMapMaterialPatch>}
         */
        this.graph = new Graph();

        /**
         * Contains patches to speed up lookup
         * @type {QuadTreeNode<SplatMapMaterialPatch>}
         */
        this.quadTree = new QuadTreeNode();

        /**
         *
         * @type {Uint8Array}
         */
        this.ranking = null;

        /**
         *
         * @type {SplatMapping}
         */
        this.mapping = null;

        /**
         *
         * @type {BitSet}
         */
        this.marks = new BitSet();

    }

    /**
     *
     * @param {SplatMapping} mapping
     * @return {Promise}
     */
    static optimizeSynchronous(mapping) {

        const optimizer = new SplatMapOptimizer();

        optimizer.mapping = mapping;

        const tasks = optimizer.optimize();

        const executor = new ConcurrentExecutor(0, Number.POSITIVE_INFINITY);

        executor.runMany(tasks);

        return Task.promiseAll(tasks);
    }

    /**
     * @returns {Task[]}
     */
    optimize() {

        const result = [];

        const tInitialize = this.initialize();

        Array.prototype.push.apply(result, tInitialize);

        // optimizer.removePatchesSmallerThan(100);

        const self = this;

        const tMergePatches = new Task({
            name: 'Merge redundant patches',
            cycleFunction() {
                const removedPatchCount = self.mergeRedundantPatches();

                if (removedPatchCount === 0) {
                    return TaskSignal.EndSuccess;
                }

                return TaskSignal.Continue;
            }
        });

        tMergePatches.addDependencies(tInitialize);

        result.push(tMergePatches);

        const tSolve = actionTask(() => this.solve());

        tSolve.addDependency(tMergePatches);
        tSolve.addDependencies(tInitialize);

        result.push(tSolve);

        return result;
    }


    /**
     *
     * @param {SplatMapMaterialPatch} patch
     */
    removePatch(patch) {

        this.graph.removeNode(patch);
        patch.quad.disconnect();

    }

    removeNoisePatches(threshold = 0.05) {

        const nodes = this.graph.nodes;
        const n = nodes.length;

        const garbage = [];

        const depth = this.mapping.depth;
        const weightData = this.mapping.weightData;

        for (let i = 0; i < n; i++) {
            const node = nodes[i];

            const contribution = node.computeMaxWeightContribution(weightData, depth);

            if (contribution < threshold) {
                garbage.push(node);
            }
        }

        for (let i = 0; i < garbage.length; i++) {
            this.removePatch(garbage[i]);
        }

    }

    /**
     *
     * @param {number} area
     * @param {number} contributionThreshold
     */
    removePatchesSmallerThan(area, contributionThreshold = 0.9) {

        const nodes = this.graph.nodes;
        const n = nodes.length;

        const garbage = [];

        const depth = this.mapping.depth;
        const weightData = this.mapping.weightData;

        for (let i = 0; i < n; i++) {

            const node = nodes[i];

            if (node.area >= area) {
                continue;
            }

            const contribution = node.computeMaxWeightContribution(weightData, depth);

            if (contribution < contributionThreshold) {
                garbage.push(node);
            }
        }

        for (let i = 0; i < garbage.length; i++) {
            this.removePatch(garbage[i]);
        }
    }


    /**
     * NOTE: uses flooding algorithm to build a patch
     * @param {number} materialIndex
     * @param {number} start_x
     * @param {number} start_y
     * @returns {SplatMapMaterialPatch}
     */
    buildPatch(materialIndex, start_x, start_y) {

        const mapping = this.mapping;

        /**
         *
         * @type {Uint8Array}
         */
        const ranking = this.ranking;

        const width = mapping.size.x;
        const height = mapping.size.y;

        const layerSize = width * height;

        const targetLayerAddress = layerSize * materialIndex;

        const patch = new SplatMapMaterialPatch(width, height);

        patch.materialIndex = materialIndex;
        patch.mask.reset();
        patch.aabb.setNegativelyInfiniteBounds();

        const weightData = mapping.weightData;

        const open = [start_y * width + start_x];

        const closed = new BitSet();

        const marks = this.marks;

        main: while (open.length > 0) {
            const index = open.pop();
            closed.set(index, true);

            const address = index + targetLayerAddress;

            //sample ranking of the patch texel
            const rank = ranking[address];

            if (rank > 3) {
                //will not fit in the material map, ignore
                continue;
            }

            const weight = weightData[address];


            marks.set(address, true);

            const x = index % width;
            const y = (index / width) | 0;

            patch.aabb._expandToFit(x, y, x, y);
            patch.mask.set(index, true);
            patch.area++;

            if (weight === 0) {
                //tile has weight of 0, don't bother about its neighbours
                continue main;
            }

            //build neighbours
            if (y > 0) {
                const n2 = index - width;

                if (!closed.get(n2)) {
                    open.push(n2);
                }
            }

            if (y < height - 1) {
                const n3 = index + width;

                if (!closed.get(n3)) {
                    open.push(n3);
                }
            }

            if (x > 0) {
                const n0 = index - 1;

                if (!closed.get(n0)) {
                    open.push(n0);
                }
            }

            if (x < width - 1) {
                const n1 = index + 1;

                if (!closed.get(n1)) {
                    open.push(n1);
                }
            }

            continue main;

        }

        return patch;
    }

    mergeRedundantPatches() {
        const graph = this.graph;
        const nodes = graph.nodes;

        /**
         *
         * @type {SplatMapMaterialPatch[][]}
         */
        const chains = [];

        for (let i = 0; i < nodes.length; i++) {
            const patch = nodes[i];

            const chain = [patch];

            graph.traverseSuccessors(patch, n => {
                if (n === patch) {
                    //skip edges to self
                    return;
                }

                if (n.materialIndex === patch.materialIndex) {

                    for (let j = 0; j < chains.length; j++) {
                        const chain = chains[j];

                        if (chain.indexOf(n) !== -1) {
                            //already a part of a chain, skip
                            return;
                        }

                    }

                    chain.push(n);
                }
            });

            if (chain.length > 1) {
                chains.push(chain);
            }
        }

        //merge chains
        let chainCount = chains.length;
        for (let i = 0; i < chainCount; i++) {
            const chain_0 = chains[i];

            let chain_0_length = chain_0.length;

            for (let j = 0; j < chain_0_length; j++) {
                const link_0 = chain_0[j];

                for (let k = i + 1; k < chainCount; k++) {
                    const chain_1 = chains[k];

                    const link_1_index = chain_1.indexOf(link_0);

                    if (link_1_index === -1) {
                        continue;
                    }

                    //found a match, lets merge the chains
                    for (let m = 0; m < chain_1.length; m++) {
                        const link_1 = chain_1[m];

                        if (chain_0.indexOf(link_1) === -1) {
                            chain_0.push(link_1);
                            chain_0_length++;
                        }
                    }

                    //remove the chain
                    chains.splice(k, 1);

                    //update iterators
                    k--;
                    chainCount--;
                }
            }
        }

        /**
         *
         * @type {SplatMapMaterialPatch[]}
         */
        const garbage = [];

        //execute merge
        for (let i = 0; i < chainCount; i++) {
            const chain = chains[i];

            const target = chain[0];

            for (let j = 1; j < chain.length; j++) {

                const source = chain[j];

                if (garbage.indexOf(target) !== -1) {
                    //desired merge target has already been marked as garbage, skip merge
                    continue;
                }

                target.add(source);

                //take over connections of the source
                const neighbours = graph.getNeighbours(source);

                const neighboursCount = neighbours.length;

                for (let j = 0; j < neighboursCount; j++) {
                    const neighbour = neighbours[j];

                    if (neighbour !== target || !graph.edgeExists(target, neighbour)) {
                        graph.createEdge(target, neighbour);
                    }
                }

                garbage.push(source);

            }
        }

        //cleanup
        for (let i = 0; i < garbage.length; i++) {
            const patch = garbage[i];
            this.removePatch(patch);
        }

        return garbage.length;
    }

    /**
     *
     * @param {SplatMapMaterialPatch} patch
     */
    insertPatch(patch) {
        /**
         *
         * @type {SplatMapMaterialPatch[]}
         */
        const connectedPatches = [];

        this.graph.addNode(patch);

        const bb = patch.aabb;

        /**
         *
         * @param {QuadTreeDatum<SplatMapMaterialPatch>} container
         * @param {number} x
         * @param {number} y
         */
        function visitOverlap(container, x, y) {
            const otherPatch = container.data;

            const overlaps = otherPatch.test(x, y);

            if (overlaps && connectedPatches.indexOf(otherPatch) === -1) {
                connectedPatches.push(otherPatch);
            }
        }

        //traverse the patch to find overlaps with other patches
        for (let y = bb.y0; y <= bb.y1; y++) {

            for (let x = bb.x0; x <= bb.x1; x++) {

                if (!patch.test(x, y)) {
                    continue;
                }

                this.quadTree.traversePointIntersections(x, y, visitOverlap);
            }

        }

        if (patch.quad !== null) {
            patch.quad.disconnect();
        }

        const quadTreeDatum = this.quadTree.add(patch, bb.x0, bb.y0, bb.x1, bb.y1);
        patch.quad = quadTreeDatum;

        //insert edges to connecting patches
        for (let i = 0; i < connectedPatches.length; i++) {
            const other = connectedPatches[i];

            this.graph.createEdge(patch, other);
        }

    }

    /**
     *
     * @return {Task[]}
     */
    initialize() {
        this.graph.clear();

        //build patches

        const mapping = this.mapping;

        const width = mapping.size.x;
        const height = mapping.size.y;
        const depth = mapping.depth;

        const weightData = mapping.weightData;

        this.ranking = new Uint8Array(width * height * depth);

        //build ranking map
        const tComputeRankings = mapping.computeWeightRankingMap(this.ranking);

        const marks = this.marks;
        marks.reset();

        const layerSize = width * height;

        const tBuildPatches = countTask(0, layerSize * depth, address => {

            if (marks.get(address)) {
                //already processed, skip
                return;
            }

            if (weightData[address] === 0) {
                //tile has 0 weight, don't make a patch for it
                return;
            }

            const d = (address / layerSize) | 0;
            const layerIndex = address % layerSize;


            const y = (layerIndex / width) | 0;
            const x = layerIndex % width;

            const patch = this.buildPatch(d, x, y);

            if (patch.area === 0) {
                return;
            }

            this.insertPatch(patch);

        });

        tBuildPatches.addDependency(tComputeRankings);

        return [tComputeRankings, tBuildPatches];
    }

    solve() {
        const nodes = this.graph.nodes;

        let nodeCount = nodes.length;

        const weightData = this.mapping.weightData;
        const materialSampler = this.mapping.materialSampler;

        for (let i = 0; i < nodeCount; i++) {
            const patch = nodes[i];

            patch.readWeights(weightData);
        }

        nodeCount = nodes.length;

        const colors = colorizeGraphGreedyWeight(this.graph);

        if (!validateGraphColoring(colors, this.graph)) {
            console.error('Created invalid graph coloring');
        }

        //split colored sets into those that fit the channel set and those that don't
        const colorMappableNodes = [];
        const colorFloatingNodes = [];

        for (let i = 0; i < nodeCount; i++) {
            const c = colors[i];

            if (c >= materialSampler.itemSize) {
                colorFloatingNodes.push(i);
            } else {
                colorMappableNodes.push(i);
            }
        }


        //purge materials
        const materialData = materialSampler.data;
        materialData.fill(255);

        const occupancy = new BitSet();

        for (let i = 0; i < colorMappableNodes.length; i++) {
            const nodeIndex = colorMappableNodes[i];

            const patch = nodes[nodeIndex];

            const color = colors[nodeIndex];

            patch.write(color, materialSampler, occupancy);

        }

        for (let i = 0; i < colorFloatingNodes.length; i++) {
            const nodeIndex = colorFloatingNodes[i];

            const patch = nodes[nodeIndex];

            patch.writeByOccupancy(materialSampler, occupancy);
        }

        this.mapping.materialTexture.needsUpdate = true;
        this.mapping.weightTexture.needsUpdate = true;

        // const d = new SplatMapOptimizerDebugger();
        //
        // const v = d.build(this.graph);
        //
        // v.link();
        // window.document.body.appendChild(v.el);

        return colors;
    }
}
