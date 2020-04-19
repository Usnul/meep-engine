import { BitSet } from "../../binary/BitSet.js";
import { colorizeGraphGreedy } from "./colorizeGraphGreedy.js";

/**
 * Based on paper "Register Allocation via Coloring of Chordal Graphs - Magno et al."
 * Based on C++ implementation by @brrcrites: https://github.com/brrcrites/graph-coloring/blob/master/Source/mcs.cpp
 * @param {Graph} graph
 * @returns {Uint32Array} color assignments, indices correspond to node indices in the graph
 */
export function colorizeGraphMCS(graph) {
    /**
     * Closed set
     * @type {BitSet}
     */
    const closed = new BitSet();

    const nodes = graph.nodes;
    const nodeCount = nodes.length;

    /**
     *
     * @type {Float32Array}
     */
    const weights = new Float32Array(nodeCount);
    /**
     *
     * @type {number[]}
     */
    const ordering = [];



    // Work through all the nodes in the graph, choosing the node
    // with maximum weight, then add that node to the queue. Increase
    // the weight of the queued nodes neighbors by 1. Continue until
    // every node in the graph has been added to the queue
    for (let i = 0; i < nodeCount; i++) {
        let max_weight = -1;
        let max_vertex = -1;


        // Out of the remaining nodes, find the node with the highest weight
        for (let j = 0; j < nodeCount; j++) {

            if (closed.get(j)) {
                //already processed
                continue;
            }

            const weight = weights[j];
            if (weight > max_weight) {
                max_weight = weight;
                max_vertex = j;
            }
        }

        if (max_vertex === -1) {
            throw new Error("Could not find a max weight node in the graph (reason unknown)");
        }

        // Add highest weight node to the queue and increment all of its neighbors weights by 1
        ordering.push(max_vertex);

        const node = nodes[max_vertex];

        const neighbours = graph.getNeighbours(node);
        const neighbourCount = neighbours.length;

        for (let j = 0; j < neighbourCount; j++) {
            const neighbour = neighbours[j];
            const neighbourIndex = nodes.indexOf(neighbour);

            weights[neighbourIndex]++;
        }

        // Remove the maximum weight node from the graph so that it won't
        // be accidentally added again
        closed.set(i, true);
    }

    return colorizeGraphGreedy(graph, ordering);
}
