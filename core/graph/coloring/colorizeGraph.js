/**
 * Solves graph coloring problem
 * @template N
 * @param {Graph<N>} graph
 * @returns {number[]} Color number, index corresponds to node index in the graph
 */
export function colorizeGraph(graph) {
    //convert graph into matrix form
    const matrix = graphToMatrix(graph);

    return colorizing(matrix.data, matrix.vertexCount);
}

/**
 * @template N
 * @param {Graph<N>} graph
 * @returns {{vertexCount:number, data: Uint8Array}}
 */
function graphToMatrix(graph) {
    const nodes = graph.nodes;

    const vertexCount = nodes.length;

    const data = new Uint8Array(vertexCount * vertexCount);

    for (let i = 0; i < vertexCount; i++) {
        const node = nodes[i];

        const attachedEdges = graph.getAttachedEdges(node);

        const nAttachedEdges = attachedEdges.length;

        for (let j = 0; j < nAttachedEdges; j++) {
            const edge = attachedEdges[j];

            const otherNode = edge.other(node);

            const transition = edge.validateTransition(node, otherNode);

            if (transition) {
                const otherNodeIndex = nodes.indexOf(otherNode);

                data[i * vertexCount + otherNodeIndex] = 1;
            }
        }
    }

    return { vertexCount, data };
}

/**
 * this function finds the unprocessed vertex of which degree is maximum
 * @param {number} vertexCount
 * @param {number[]} colors
 * @param {number[]} degree
 * @return {number}
 */
function computeMaxDegreeVertex(vertexCount, colors, degree) {

    let max = -1;
    let max_i;

    for (let i = 0; i < vertexCount; i++) {

        if ((colors[i] === 0) && (degree[i] > max)) {
            max = degree[i];
            max_i = i;
        }

    }

    return max_i;
}

/**
 *
 * @param {number[]} NN
 * @param {number[]} a
 * @param {number} vertexCount
 * @param {number[]} colors
 * @param {number} colorNumber
 */
function updateNN(NN, a, vertexCount, colors, colorNumber) {

    NN.splice(0, NN.length);

    for (var i = 0; i < vertexCount; i++) {
        if (colors[i] === 0) {
            NN.push(i);
        }
    }

    for (var i = 0; i < vertexCount; i++) {


        if (colors[i] === colorNumber) {

            const columnAddress = i * vertexCount;

            for (var j = 0; j < NN.length; j++) {


                while (a[columnAddress + NN[j]] === 1) {
                    NN.splice(j, 1)
                }

            }

        }
    }

}

/**
 *
 * @param {number} vertexCount
 * @param {number[]} a
 * @param {number[]} NN
 * @param {number[]} color
 * @param {number} colorNumber
 * @return {(number)[]}
 */
function findSuitableY(vertexCount, a, NN, color, colorNumber) {
    var temp, tmp_y, y = 0;

    var scanned = [];

    let VerticesInCommon = 0;

    for (var i = 0; i < NN.length; i++) {
        tmp_y = NN[i];
        temp = 0;

        for (var f = 0; f < vertexCount; f++) {
            scanned[f] = 0;
        }

        for (var x = 0; x < vertexCount; x++) {

            if (color[x] === colorNumber) {

                for (var k = 0; k < vertexCount; k++) {

                    if (color[k] === 0 && scanned[k] === 0) {

                        const i0 = x * vertexCount + k;
                        const i1 = tmp_y * vertexCount + k;

                        if (a[i0] === 1 && a[i1] === 1) {
                            temp++;
                            scanned[k] = 1;
                        }
                    }
                }
            }

        }

        if (temp > VerticesInCommon) {
            VerticesInCommon = temp;
            y = tmp_y;
        }
    }

    return [y, VerticesInCommon];
}


/**
 * find the vertex in NN of which degree is maximum
 * @param {number[]} NN
 * @param {number[]} colors
 * @param {number[]} degree
 */
function computeMaxDegreeInNN(NN, colors, degree) {

    var max = -1;
    var max_i, i;

    const l = NN.length;

    for (var k = 0; k < l; k++) {
        i = NN[k];

        if ((colors[i] === 0) && (degree[i] > max)) {
            max = degree[i];
            max_i = i;
        }

    }

    return max_i;
}

/**
 * Accepts a graph in matrix form
 * @param {number[]|Uint8Array} a
 * @param {number} vertexCount
 * @return {number[]}
 */
function colorizing(a, vertexCount) {
    const NN = [];

    var colors = [];
    var degrees = [];

    for (var i = 0; i < vertexCount; i++) {

        colors[i] = 0;
        degrees[i] = 0;

        for (var j = 0; j < vertexCount; j++) {
            const address = i * vertexCount + j;

            if (a[address] === 1) {
                degrees[i]++;
            }

        }

    }

    var x, y;
    var result;
    var colorNumber = 0;
    var VerticesInCommon = 0;
    var unprocessed = vertexCount;

    while (unprocessed > 0) {
        x = computeMaxDegreeVertex(vertexCount, colors, degrees);

        colorNumber++;

        colors[x] = colorNumber;

        unprocessed--;

        updateNN(NN, a, vertexCount, colors, colorNumber);

        while (NN.length > 0) {

            result = findSuitableY(vertexCount, a, NN, colors, colorNumber);

            y = result[0];
            VerticesInCommon = result[1];
            if (VerticesInCommon === 0) {
                y = computeMaxDegreeInNN(NN, colors, degrees);
            }
            colors[y] = colorNumber;
            unprocessed--;

            updateNN(NN, a, vertexCount, colors, colorNumber);
        }
    }

    return colors;
}
