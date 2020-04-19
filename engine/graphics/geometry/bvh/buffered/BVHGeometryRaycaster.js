import Vector3, { v3Length_i } from "../../../../../core/geom/Vector3.js";

import { Ray as ThreeRay, Vector3 as ThreeVector3 } from 'three';
import { rayTriangleIntersection } from "../../../../../core/geom/GeometryMath.js";
import { SurfacePoint3 } from "../../../../../core/geom/3d/SurfacePoint3.js";

const hit = new ThreeVector3();
const ray = new ThreeRay();

const vA = new ThreeVector3(),
    vB = new ThreeVector3(),
    vC = new ThreeVector3();

function bindGeometryFace(indices, vertices, index) {
    const index3 = index * 3;
    const a = indices[index3] * 3;
    const b = indices[index3 + 1] * 3;
    const c = indices[index3 + 2] * 3;

    vA.set(vertices[a], vertices[a + 1], vertices[a + 2]);
    vB.set(vertices[b], vertices[b + 1], vertices[b + 2]);
    vC.set(vertices[c], vertices[c + 1], vertices[c + 2]);
}

const vNormal = new Vector3();

function bindGeometryFaceNormal(indices, normals, index) {

    const index3 = index * 3;

    const a = indices[index3] * 3;
    const b = indices[index3 + 1] * 3;
    const c = indices[index3 + 2] * 3;

    //read vertex normals
    const naX = normals[a];
    const naY = normals[a + 1];
    const naZ = normals[a + 2];

    const nbX = normals[b];
    const nbY = normals[b + 1];
    const nbZ = normals[b + 2];

    const ncX = normals[c];
    const ncY = normals[c + 1];
    const ncZ = normals[c + 2];

    //add normals
    const nsX = (naX + nbX + ncX);
    const nsY = (naY + nbY + ncY);
    const nsZ = (naZ + nbZ + ncZ);

    //normalize
    const l = v3Length_i(nsX, nsY, nsZ);
    const m = 1 / l;

    const nx = nsX * m;
    const ny = nsY * m;
    const nz = nsZ * m;

    vNormal.set(nx, ny, nz);
}

function computeSampleFaceIndex(width, x, y) {

    //get fraction of x and y
    const xF = x % 1;
    const yF = y % 1;

    //get whole part of x and y
    const xW = x | 0;
    const yW = y | 0;

    //figure out which quad it is in
    const iQuad = yW * (width - 1) + xW;

    //figure out triangle
    const index = iQuad * 2 + ((xF + yF) | 0);

    return index;
}


function extractFaceIndexFromLeaf_default(leaf) {
    return leaf.object;
}

export class BVHGeometryRaycaster {
    constructor() {
        /**
         *
         * @type {BufferGeometry|null}
         */
        this.geometry = null;
        /**
         *
         * @type {BinaryNode|null}
         */
        this.bvh = null;

        /**
         *
         * @type {Vector2|null}
         */
        this.position = null;
        /**
         *
         * @type {Vector2|null}
         */
        this.scale = null;
        /**
         *
         * @type {number}
         */
        this.resolution = 0;

        /**
         *
         * @type {Vector2|null}
         */
        this.size = null;

        this.__bestDistance = 0;
        this.__bestPosition = new Vector3();
        this.__bestIndex = 0;


        this.origin = new Vector3();
        this.direction = new Vector3();

        this.extractFaceIndexFromLeaf = extractFaceIndexFromLeaf_default;
    }

    /**
     *
     * @param {*} leaf
     */
    visitLeafIntersection(leaf) {

        const geometry = this.geometry;

        const geometryIndices = geometry.getIndex().array;
        const geometryVertices = geometry.getAttribute('position').array;

        const extractFaceIndexFromLeaf = this.extractFaceIndexFromLeaf;

        const index = extractFaceIndexFromLeaf(leaf);

        bindGeometryFace(geometryIndices, geometryVertices, index);

        const hitFound = rayTriangleIntersection(hit, this.origin, this.direction, vA, vB, vC);

        if (hitFound) {

            const d = this.origin.distanceSqrTo(hit);
            if (d < this.__bestDistance) {
                this.__bestDistance = d;
                this.__bestPosition.copy(hit);
                this.__bestIndex = index;
            }

        }
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param callback
     * @param missCallback
     */
    raycastVertical(x, y, callback, missCallback) {
        const position = this.position;
        const scale = this.scale;

        //transform position to geometry coordinate system
        const resolution = this.resolution;

        const size = this.size;

        const width = size.x * resolution;
        const height = size.y * resolution;


        const gX = ((x - position.x * scale.x) / scale.x) * resolution * ((width - 1) / width);
        const gY = ((y - position.y * scale.y) / scale.y) * resolution * ((height - 1) / height);

        const index = computeSampleFaceIndex(width, gX, gY);

        const geometry = this.geometry;

        const geometryIndices = geometry.getIndex().array;
        const geometryVertices = geometry.getAttribute('position').array;
        const geometryNormals = geometry.getAttribute('normal').array;

        bindGeometryFace(geometryIndices, geometryVertices, index);


        this.direction.set(0, -1, 0);
        this.origin.set(x, 1000, y);

        const hitFound = rayTriangleIntersection(hit, this.origin, this.direction, vA, vB, vC);

        if (!hitFound) {
            missCallback();
            return;
        }

        bindGeometryFaceNormal(geometryIndices, geometryNormals, index);

        callback(hit, vNormal, geometry);
    }

    /**
     *
     * @param {SurfacePoint3} hit
     * @param {number} originX
     * @param {number} originY
     * @param {number} originZ
     * @param {number} directionX
     * @param {number} directionY
     * @param {number} directionZ
     * @returns {boolean}
     */
    raycast(hit, originX, originY, originZ, directionX, directionY, directionZ) {

        this.origin.set(originX, originY, originZ);
        this.direction.set(directionX, directionY, directionZ);

        this.__bestDistance = Number.POSITIVE_INFINITY;

        this.bvh.traverseRayLeafIntersections(originX, originY, originZ, directionX, directionY, directionZ, this.visitLeafIntersection, this);

        if (this.__bestDistance !== Number.POSITIVE_INFINITY) {

            const geometry = this.geometry;

            const geometryIndices = geometry.getIndex().array;
            const geometryNormals = geometry.getAttribute('normal').array;

            bindGeometryFaceNormal(geometryIndices, geometryNormals, this.__bestIndex);

            hit.position.copy(this.__bestPosition);
            hit.normal.copy(vNormal);

            return true;
        } else {
            //no hit
            return false;
        }
    }
}
