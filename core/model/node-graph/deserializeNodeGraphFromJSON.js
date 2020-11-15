import { assert } from "../../assert.js";
import { NodeInstance } from "./node/NodeInstance.js";

/**
 *
 * @param {NodeGraph} graph
 * @param {{nodes:[], connections:[]}} json
 * @param {NodeRegistry} node_registry
 */
export function deserializeNodeGraphFromJSON(graph, json, node_registry) {

    const nodes = json.nodes;
    const connections = json.connections;


    assert.defined(nodes, 'json.nodes');
    assert.defined(connections, 'json.connections');

    graph.reset();

    // parse nodes
    const node_count = nodes.length;

    for (let i = 0; i < node_count; i++) {
        const jNode = nodes[i];

        const node_id = jNode.id;

        assert.isNonNegativeInteger(node_id, 'node.id');

        const description = jNode.description;

        const parameters = jNode.parameters;

        // get node description
        const node_description = node_registry.getNode(description);

        if (node_description === undefined) {
            throw new Error(`Node ${description} not found in the registry`);
        }

        const nodeInstance = new NodeInstance();

        nodeInstance.id = node_id;
        nodeInstance.setDescription(node_description);
        nodeInstance.setParameters(parameters);

        graph.addNode(nodeInstance);
    }

    // parse connections
    const connection_count = connections.length;

    for (let i = 0; i < connection_count; i++) {
        const jConnection = connections[i];

        const jSource = jConnection.source;
        const jTarget = jConnection.target;

        graph.createConnection(jSource.instance, jSource.port, jTarget.instance, jTarget.port);
    }
}
