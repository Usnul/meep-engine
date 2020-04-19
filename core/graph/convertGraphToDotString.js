import LineBuilder from "../codegen/LineBuilder.js";
import { EdgeDirectionType } from "./Edge.js";

/**
 * Build a DOT representation of the graph
 * @param {Graph} graph
 * @returns {string}
 */
export function convertGraphToDotString(graph) {
    const lb = new LineBuilder();

    lb.add('strict digraph Graph {');

    lb.indent();

    const nodes = graph.nodes;
    const nodeCount = nodes.length;

    function nodeId(index) {
        return `n${index}`;
    }

    for (let i = 0; i < nodeCount; i++) {

        const node = nodes[i];

        lb.add(`${nodeId(i)} [label="${node.toString()}"];`);

    }

    //add edges
    for (let i = 0; i < nodeCount; i++) {

        const node = nodes[i];

        const attachedEdges = graph.getAttachedEdges(node);

        const nAttachedEdges = attachedEdges.length;

        for (let j = 0; j < nAttachedEdges; j++) {
            const edge = attachedEdges[j];

            const direction = edge.direction;
            if ((direction === EdgeDirectionType.Forward || direction === EdgeDirectionType.Undirected) && edge.first === node) {
                const id0 = nodeId(i);

                const index1 = nodes.indexOf(edge.second);

                const id1 = nodeId(index1);

                const attributes = [];

                if (direction === EdgeDirectionType.Undirected) {
                    attributes.push('dir="both"');
                }


                lb.add(`${id0} -> ${id1}${attributes.length === 0 ? '' : ` [${attributes.join(' ')}]`};`);
            }
        }
    }

    lb.dedent();

    lb.add('}');

    return lb.build();
}
