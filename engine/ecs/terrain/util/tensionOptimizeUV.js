class TopoFace {
    constructor() {
        /**
         *
         * @type {TopoVertex[]}
         */
        this.vertices = [];
        /**
         *
         * @type {TopoEdge[]}
         */
        this.edges = [];
    }

    /**
     *
     * @param {TopoEdge} edge
     * @returns {boolean}
     */
    containsEdge(edge) {
        return this.edges.indexOf(edge) !== -1;
    }
}

class TopoEdge {
    constructor() {
        /**
         *
         * @type {TopoVertex}
         */
        this.v0 = null;
        /**
         *
         * @type {TopoVertex}
         */
        this.v1 = null;


        /**
         *
         * @type {TopoFace[]}
         */
        this.faces = [];

        /**
         *
         * @type {number}
         */
        this.lengthSqr = 0;
    }

    /**
     * Is this a an edge of topology as a whole?
     * @return {boolean}
     */
    isTopologyEdge() {
        //attached to exactly one face
        return this.faces.length === 1;
    }

    computeSquaredLength() {
        const v0 = this.v0;
        const v1 = this.v1;

        const x0 = v0.x;
        const y0 = v0.y;
        const z0 = v0.z;

        const x1 = v1.x;
        const y1 = v1.y;
        const z1 = v1.z;

        const dx = x0 - x1;
        const dy = y0 - y1;
        const dz = z0 - z1;

        this.lengthSqr = dx * dx + dy * dy + dz * dz;
    }

    /**
     *
     * @param {TopoEdge} other
     */
    merge(other) {

        //absorb faces
        const faces = other.faces;

        const ownFaces = this.faces;

        const nf = faces.length;
        for (let k = 0; k < nf; k++) {
            const topoFace = faces[k];

            if (ownFaces.indexOf(topoFace) === -1) {
                ownFaces.push(topoFace);
            }

            //remove references to old edge from the face
            const p = topoFace.edges.indexOf(other);

            if (p !== -1) {
                topoFace.edges.splice(p, 1);
            }

            //add this edge to face
            if (topoFace.edges.indexOf(this) === -1) {
                topoFace.edges.push(this);
            }
        }

        //patch vertices
        const v0E = other.v0.edges;
        const iv0 = v0E.indexOf(other);

        if (iv0 !== -1) {
            //cut old edge from vertex 0
            v0E.splice(iv0, 1);
        }

        if (!other.v0.containsEdge(this)) {
            v0E.push(this);
        }

        const v1E = other.v1.edges;
        const iv1 = v1E.indexOf(other);

        if (iv1 !== -1) {
            //cut old edge from vertex 1
            v1E.splice(iv1, 1);
        }

        if (!other.v1.containsEdge(this)) {
            other.v1.edges.push(this);
        }

    }

    /**
     *
     * @param {TopoFace} face
     * @return {boolean}
     */
    containsFace(face) {
        return this.faces.indexOf(face) !== -1;
    }

    /**
     *
     * @param {TopoFace} face
     */
    addFace(face) {
        this.faces.push(face);
    }

    /**
     *
     * @param {TopoVertex} v
     * @return {TopoVertex}
     */
    getOtherVertex(v) {
        if (v === this.v0) {
            return this.v1;
        } else {
            return this.v0;
        }
    }

    /**
     *
     * @param {TopoVertex} a
     * @param {TopoVertex} b
     * @return {boolean}
     */
    containsBothVertices(a, b) {
        const v0 = this.v0;
        const v1 = this.v1;

        return (a === v0 && b === v1) || (a === v1 && b === v0);
    }

    /**
     *
     * @param {TopoEdge} other
     */
    containsSameVerticesAs(other) {
        return this.containsBothVertices(other.v0, other.v1);
    }
}

class TopoVertex {
    constructor() {
        this.index = 0;
        /**
         *
         * @type {TopoEdge[]}
         */
        this.edges = [];

        /**
         *
         * @type {TopoFace[]}
         */
        this.faces = [];

        /**
         *
         * @type {number}
         */
        this.x = 0;
        /**
         *
         * @type {number}
         */
        this.y = 0;
        /**
         *
         * @type {number}
         */
        this.z = 0;
    }

    /**
     *
     * @param {TopoFace} face
     * @return {boolean}
     */
    containsFace(face) {
        return this.faces.indexOf(face) !== -1;
    }

    /**
     *
     * @param {TopoEdge} edge
     * @returns {boolean}
     */
    containsEdge(edge) {
        return this.edges.indexOf(edge) !== -1;
    }
}

class TopoMesh {
    constructor() {
        /**
         *
         * @type {TopoEdge[]}
         */
        this.edges = [];
        /**
         *
         * @type {TopoVertex[]}
         */
        this.vertices = [];
        /**
         *
         * @type {TopoFace[]}
         */
        this.faces = [];
    }

    /**
     *
     * @param {TopoVertex} a
     * @param {TopoVertex} b
     *
     * @returns {TopoEdge}
     */
    ensureEdge(a, b) {
        const aEdges = a.edges;
        const n = aEdges.length;

        for (let i = 0; i < n; i++) {
            const edge = aEdges[i];

            if (edge.getOtherVertex(a) === b) {
                return edge;
            }
        }

        //edge doesn't exist, lets create one
        const topoEdge = new TopoEdge();

        topoEdge.v0 = a;
        topoEdge.v1 = b;

        a.edges.push(topoEdge);
        b.edges.push(topoEdge);

        this.edges.push(topoEdge);

        return topoEdge;
    }

    mergeEdges() {
        const edges = this.edges;
        let n = edges.length;

        for (let i = 0; i < n; i++) {
            const e0 = edges[i];

            const e0v0 = e0.v0;
            const e0v1 = e0.v1;

            for (let j = i + 1; j < n; j++) {
                const e1 = edges[j];

                const e1v0 = e1.v0;
                const e1v1 = e1.v1;

                if (e0v0 === e1v0) {
                    if (e0v1 !== e1v1) {
                        //not a match
                        continue;
                    }
                } else if (e0v0 === e1v1) {
                    if (e0v1 !== e1v0) {
                        //not a match
                        continue;
                    }
                } else {
                    //not a match
                    continue;
                }

                //cut the second edge
                edges.splice(j, 1);
                j--;
                n--;

                //absorb edge
                e0.merge(e1);
            }
        }
    }

    computeEdgeSquaredLengths() {
        const topoEdges = this.edges;

        const n = topoEdges.length;

        for (let i = 0; i < n; i++) {

            const edge = topoEdges[i];

            edge.computeSquaredLength();

        }
    }

    /**
     *
     * @param {Float32Array} vertices
     * @param {Uint16Array} faces
     */
    build(vertices, faces) {

        const nVertices = vertices.length / 3;

        //populate vertices
        for (let i = 0; i < nVertices; i++) {

            const i3 = i * 3;

            const v = new TopoVertex();

            v.index = i;

            v.x = vertices[i3];
            v.y = vertices[i3 + 1];
            v.z = vertices[i3 + 2];

            this.vertices[i] = v;
        }

        const nFaces = faces.length / 3;

        for (let i = 0; i < nFaces; i++) {
            const i3 = i * 3;

            const a = faces[i3];
            const b = faces[i3 + 1];
            const c = faces[i3 + 2];

            const vA = this.vertices[a];
            const vB = this.vertices[b];
            const vC = this.vertices[c];

            const f = new TopoFace();

            const eAB = this.ensureEdge(vA, vB);
            const eBC = this.ensureEdge(vB, vC);
            const eCA = this.ensureEdge(vC, vA);

            //link primitives
            eAB.faces.push(f);
            eBC.faces.push(f);
            eCA.faces.push(f);

            f.vertices.push(vA, vB, vC);
            f.edges.push(eAB, eBC, eCA);


            vA.faces.push(f);
            vB.faces.push(f);
            vC.faces.push(f);

            this.faces[i] = f;
        }
    }
}

/**
 * Move UVs to reduce stretching
 *
 * @param {Float32Array} vertices
 * @param {Float32Array} uvs
 * @param {Uint16Array} faces
 * @param {number} steps Number of optimization passes to perform
 */
export function tensionOptimizeUV(vertices, uvs, faces, steps) {

    // Build topology from the data, we need to know which faces are connected to each vertex
    const topo = new TopoMesh();

    topo.build(vertices, faces);
    topo.computeEdgeSquaredLengths();

    const nVertices = vertices.length / 3;

    for (let i = 0; i < steps; i++) {

        loop_vertices: for (let j = 0; j < nVertices; j++) {

            const topoVertex = topo.vertices[j];

            // 1) get attached edges

            const attachedEdges = topoVertex.edges;

            const nAttachedEdges = attachedEdges.length;

            if (nAttachedEdges === 0) {
                continue;
            }

            // Compute neighbour UV weight based on edge length

            let uSum = 0;
            let vSum = 0;

            let uvWeightSum = 0;

            for (let k = 0; k < nAttachedEdges; k++) {
                const attachedEdge = attachedEdges[k];

                if (attachedEdge.isTopologyEdge()) {
                    //edge vertex, no adjustment possible
                    continue loop_vertices;
                }

                const otherVertex = attachedEdge.getOtherVertex(topoVertex);

                const otherUvAddress = otherVertex.index * 2;

                const u = uvs[otherUvAddress];
                const v = uvs[otherUvAddress + 1];

                const weight = 1 / attachedEdge.lengthSqr;

                uSum += u * weight;
                vSum += v * weight;

                uvWeightSum += weight;
            }

            //compute new UV position to equalize the vertex distance
            const u = uSum / uvWeightSum;
            const v = vSum / uvWeightSum;

            const uvAddress = topoVertex.index * 2;
            uvs[uvAddress] = u;
            uvs[uvAddress + 1] = v;
        }
    }
}
