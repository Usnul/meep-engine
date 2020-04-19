import { colorizeGraphGreedy } from "./colorizeGraphGreedy.js";

/**
 *
 * @param {Graph} graph
 * @return {Uint32Array}
 */
export function colorizeGraphGreedyWeight(graph) {
    const nodeCount = graph.nodes.length;

    const weights = new Float32Array(nodeCount);

    const order = new Array(nodeCount);

    for (let i = 0; i < nodeCount; i++) {
        const n = graph.nodes[i];

        const neighbours = graph.getNeighbours(n);

        weights[i] = neighbours.length;
        order[i] = i;
    }

    //sort nodes by weight
    order.sort((a, b) => weights[b] - weights[a]);

    return colorizeGraphGreedy(graph, order);
}
