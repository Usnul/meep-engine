/**
 *
 * @param {number[]} colors
 * @param {Graph} graph
 * @returns {boolean}
 */
export function validateGraphColoring(colors, graph) {
    const nodes = graph.nodes;
    const nodeCount = nodes.length;

    if (colors.length < nodeCount) {
        //wrong number of colors
        return false;
    }

    for (let i = 0; i < nodeCount; i++) {

        const node = nodes[i];
        const color = colors[i];

        const neighbours = graph.getNeighbours(node);

        const neighbourCount = neighbours.length;


        for (let j = 0; j < neighbourCount; j++) {
            const neighbour = neighbours[j];

            if (neighbour === node) {
                //edge to self
                continue;
            }

            const neighbourIndex = nodes.indexOf(neighbour);

            const neighbourColor = colors[neighbourIndex];

            if (color === neighbourColor) {
                return false;
            }
        }
    }

    return true;
}
