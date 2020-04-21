/**
 * @param {{connections:Connection[]}[]} nodes
 * @return {Array}
 */
export function computeDisconnectedSubGraphs(nodes) {

    //find disconnected sub-graphs
    const unexplored = nodes.slice();

    let cursor, i;


    let currentCluster;

    function exploreNode(node) {
        const i = unexplored.indexOf(node);
        if (i !== -1) {
            unexplored.splice(i, 1);

            currentCluster.push(node);
        }
    }

    const clusters = [];

    while (unexplored.length > 0) {
        const node = unexplored.pop();

        currentCluster = [node];

        cursor = 0;
        while (cursor < currentCluster.length) {
            const node = currentCluster[cursor++];

            const connections = node.connections;

            for (i = 0; i < connections.length; i++) {
                const connection = connections[i];

                const source = connection.source;
                const target = connection.target;

                if (source === node) {
                    exploreNode(target);
                } else {
                    exploreNode(source);
                }

            }

        }

        clusters.push(currentCluster);
    }

    return clusters;
}
