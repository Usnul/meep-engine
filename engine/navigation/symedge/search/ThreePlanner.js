/**
 * User: Alex Goldring
 * Date: 3/29/2014
 * Time: 1:13 AM
 */
import Planner from './Planner.js';
import Mesh from '../Mesh.js';
import Face from '../Face.js';
import Vertex from '../Vertex.js';

export default function (geometry) {

    const mesh = new Mesh();
    mesh.vertices = geometry.vertices.map(function (v) {
        return new Vertex(v.x, v.y, v.z);
    });
    const vertices = mesh.vertices;
    mesh.faces = geometry.faces.map(function (f) {
        return new Face(vertices[f.a], vertices[f.b], vertices[f.c]);
    });
    mesh.buildEdges();
    mesh.buildSymEdges();
    return new Planner(mesh);
};
