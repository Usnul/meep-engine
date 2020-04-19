import { BitSet } from "../../binary/BitSet.js";

/**
 *
 * @param {Graph} graph
 * @param {number[]|Uint8Array|Uint16Array|Uint32Array} order
 * @return {Uint32Array}
 */
export function colorizeGraphGreedy(graph, order) {
    const nodeCount = order.length;
    /**
     *
     * @type {Uint32Array}
     */
    const colors = new Uint32Array(nodeCount);

    const nodes = graph.nodes;

    const coloredSet = new BitSet();

    const neighbourColorSet = new BitSet();

    // Work through the queue in order and color each node

    for (let i = 0; i < nodeCount; i++) {


        // Find the lowest possible graph_colors for this node between
        // its neighbors
        const nodeIndex = order[i];
        const node = nodes[nodeIndex];

        //Collect color numbers of neighbors
        neighbourColorSet.reset();

        const neighbours = graph.getNeighbours(node);
        const neighbourCount = neighbours.length;

        for (let j = 0; j < neighbourCount; j++) {
            const neighbour = neighbours[j];
            const neighbourIndex = nodes.indexOf(neighbour);


            if (!coloredSet.get(neighbourIndex)) {
                //color is not initialized yet
                continue;
            }

            const neighbourColor = colors[neighbourIndex];

            neighbourColorSet.set(neighbourColor, true);
        }

        //Pick the lowest color not contained
        const color = neighbourColorSet.nextClearBit(0);

        colors[nodeIndex] = color;

        coloredSet.set(nodeIndex, true);
    }

    return colors;
}
