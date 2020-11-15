/**
 *
 * @param {NodeGraph} graph
 */
export function serializeNodeGraphToJSON(graph) {
    const nodes = [];

    graph.traverseNodes(node => {

        nodes.push({
            id: node.id,
            description: node.description.id,
            parameters: node.parameters
        });

    });

    const connections = [];

    graph.traverseConnections(connection => {

        connections.push({
            source: {
                instance: connection.source.instance.id,
                port: connection.source.port.id
            },
            target: {
                instance: connection.target.instance.id,
                port: connection.target.port.id
            }
        });

    });

    return {
        nodes,
        connections
    };
}

