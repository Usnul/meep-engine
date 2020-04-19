import Graph from "../Graph.js";
import { colorizeGraphGreedy } from "./colorizeGraphGreedy.js";

test('empty graph', () => {
    const graph = new Graph();

    const colors = colorizeGraphGreedy(graph, []);

    expect(colors.length).toBe(0);
});

test('two connected nodes', () => {
    const graph = new Graph();

    graph.addNode(1);
    graph.addNode(2);

    graph.createEdge(1, 2);


    const colors = colorizeGraphGreedy(graph, [0, 1]);

    expect(colors.length).toBe(2);

    expect(colors[0]).not.toBe(colors[1]);
});
