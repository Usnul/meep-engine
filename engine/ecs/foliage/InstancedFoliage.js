import { BinaryNode } from "../../../core/bvh2/BinaryNode.js";
import {
    deserializeRowFirstTable,
    RowFirstTable,
    serializeRowFirstTable
} from "../../../core/collection/table/RowFirstTable.js";
import { InstancedMeshGroup } from "../../graphics/geometry/instancing/InstancedMeshGroup.js";
import Vector3 from "../../../core/geom/Vector3.js";
import { LeafNode } from "../../../core/bvh2/LeafNode.js";
import Vector4 from "../../../core/geom/Vector4.js";

import { BufferGeometry } from 'three';
import { computeGeometryBoundingSphereMiniball } from "../../graphics/Utils.js";
import { DataType } from "../../../core/collection/table/DataType.js";
import { RowFirstTableSpec } from "../../../core/collection/table/RowFirstTableSpec.js";
import Quaternion from "../../../core/geom/Quaternion.js";
import { ThreeFrustumsIntersectionBVHVisitor } from "../../../core/bvh2/traversal/ThreeFrustumsIntersectionBVHVisitor.js";
import { FoliageVisibilitySetBuilder } from "./FoliageVisibilitySetBuilder.js";
import { traverseBinaryNodeUsingVisitor } from "../../../core/bvh2/traversal/traverseBinaryNodeUsingVisitor.js";
import { serializeBinaryNodeToBinaryBuffer } from "../../../core/bvh2/serialization/serializeBinaryNodeToBinaryBuffer.js";

/**
 * @readonly
 * @type {RowFirstTableSpec}
 */
const dataSpec = new RowFirstTableSpec([
    DataType.Float32, DataType.Float32, DataType.Float32, //position
    DataType.Uint32, //rotation
    DataType.Float32, DataType.Float32, DataType.Float32 //scale
]);

/**
 *
 * @constructor
 */
function InstancedFoliage() {
    /**
     * Minimum area on the screen to be occupied by an instance, if instance bounding sphere occupies less than this - it will be culled
     * Measured in pixels
     * @type {number}
     */
    this.minScreenArea = 32;

    /**
     *
     * @type {BinaryNode}
     */
    this.bvh = new BinaryNode();
    this.bvh.setNegativelyInfiniteBounds();

    /**
     *
     * @type {RowFirstTable}
     */
    this.data = new RowFirstTable(dataSpec);

    /**
     *
     * @type {InstancedMeshGroup}
     */
    this.instances = new InstancedMeshGroup();

    this.geometry = null;
    this.instanceBoundingSphere = new Vector4(0, 0, 0, 0);


    this.bvhVisibilityVisitor = new ThreeFrustumsIntersectionBVHVisitor();

    this.visibilitySetBuilder = new FoliageVisibilitySetBuilder();
    this.bvhVisibilityVisitor.collector = this.visibilitySetBuilder;
}

InstancedFoliage.prototype.initialize = function () {

};

/**
 *
 * @param {Vector3} position
 * @param {Quaternion} rotation
 * @param {Vector3} scale
 */
InstancedFoliage.prototype.add = function (position, rotation, scale) {
    const index = this.data.length;

    const encodedRotation = rotation.encodeToUint32();

    //update data
    this.data.addRow([
        position.x, position.y, position.z,
        encodedRotation,
        scale.x, scale.y, scale.z
    ]);

    const leaf = new LeafNode(
        index,
        Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY
    );

    //compute bounding box for this instance
    this.expandBoundingBoxForInstance(position, rotation, scale, leaf);

    //insert bounding box into the spatial index
    this.bvh.insertNode(leaf);
};

/**
 *
 * @param {int} index Instance index
 * @param {Vector3} position Position of instance will be read into this vector
 * @param {Quaternion} rotation Rotation of instance will be read into this quaternion
 * @param {Vector3} scale Scale of the instance will be read into this Vector
 */
InstancedFoliage.prototype.read = function (index, position, rotation, scale) {
    const elementData = [];
    //read transform data for instance
    this.data.getRow(index, elementData);

    const positionX = elementData[0];
    const positionY = elementData[1];
    const positionZ = elementData[2];

    const encodedRotation = elementData[3];

    const scaleX = elementData[4];
    const scaleY = elementData[5];
    const scaleZ = elementData[6];

    position.set(positionX, positionY, positionZ);

    rotation.decodeFromUint32(encodedRotation);

    scale.set(scaleX, scaleY, scaleZ);
};

/**
 *
 * @param {AABB3} result
 * @param {Vector3} position
 * @param {Quaternion} rotation
 * @param {Vector3} scale
 */
InstancedFoliage.prototype.expandBoundingBoxForInstance = function (position, rotation, scale, result) {

    const vertexData = this.geometry.attributes.position.array;

    const rXYZ = new Vector3(rotation.x, rotation.y, rotation.z);

    const v = new Vector3(0, 0, 0);

    const c0 = new Vector3(0, 0, 0);
    const c1 = new Vector3(0, 0, 0);
    const c2 = new Vector3(0, 0, 0);

    for (let i = 0, l = vertexData.length; i < l; i += 3) {
        const x = vertexData[i];
        const y = vertexData[i + 1];
        const z = vertexData[i + 2];

        v.set(x, y, z);

        //transform point

        //apply scale
        v.multiply(scale);

        //apply rotation
        c1.copy(v).multiplyScalar(rotation.w);
        c0.copy(rXYZ).cross(v).add(c1);
        c2.copy(rXYZ).cross(c0).multiplyScalar(2);

        v.add(c2);

        //apply translation
        v.add(position);

        result._expandToFitPoint(v.x, v.y, v.z);
    }
};

InstancedFoliage.prototype.computeInstanceBoundingSphere = function () {
    this.instanceBoundingSphere = computeGeometryBoundingSphereMiniball(this.geometry);
};

InstancedFoliage.prototype.setInstance = function (geometry, material) {
    if (material === undefined) {
        throw new Error(`Material is undefined`);
    }

    if (geometry === undefined) {
        throw new Error(`Geometry is undefined`);
    }


    let bufferGeometry;
    if ((geometry instanceof BufferGeometry)) {
        bufferGeometry = geometry;
    } else {
        bufferGeometry = new BufferGeometry();
        bufferGeometry.fromGeometry(geometry);
    }


    this.geometry = bufferGeometry;

    this.instances.setMaterial(material);
    this.instances.setGeometry(bufferGeometry);

    this.computeInstanceBoundingSphere();

    //TODO: compute haul for the mesh, to use for fast AABB computation

};

/**
 *
 * @param {BinaryBuffer} buffer
 * @returns {number}
 */
function deserializeLeafValueUintVar(buffer) {
    return buffer.readUintVar();
}

InstancedFoliage.prototype.deserialize = function (buffer) {
    deserializeRowFirstTable(buffer, this.data);

    this.bvh.fromBinaryBuffer(buffer, deserializeLeafValueUintVar);
};

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {number} value
 */
function serializeLeafValueUintVar(buffer, value) {
    buffer.writeUintVar(value);
}

InstancedFoliage.prototype.serialize = function (buffer) {

    //serialize data
    serializeRowFirstTable(buffer, this.data);

    const numRows = this.data.length;

    if (numRows > 2147483647) {
        throw new Error(`Data is too large to be written (length=${numRows})`);
    }


    serializeBinaryNodeToBinaryBuffer(this.bvh, buffer, serializeLeafValueUintVar);
};


const tempQuaternion = new Quaternion();

/**
 *
 * @param {Frustum[]} frustums
 * @param {function[]} [visibilityFilters]
 */
InstancedFoliage.prototype.update = function (frustums, visibilityFilters = []) {
    const instances = this.instances;

    this.bvhVisibilityVisitor.setFrustums(frustums);

    const visibilitySetBuilder = this.visibilitySetBuilder;
    visibilitySetBuilder.setFilters(visibilityFilters);
    visibilitySetBuilder.initialize();

    const visibleElementSet = visibilitySetBuilder.visibleSet;

    const elementsToRemove = [];

    //build visible set
    traverseBinaryNodeUsingVisitor(this.bvh, this.bvhVisibilityVisitor);

    visibilitySetBuilder.finalize();

    // console.log(`Visible: `, elementsToAdd.size);

    /**
     *
     * @param index
     * @param {int} ref
     */
    function visitInstancedReference(index, ref) {
        if (!visibleElementSet.get(ref)) {
            //no longer visible
            elementsToRemove.push(ref);
        } else {
            //visible, and is already in the group, update the set
            visibleElementSet.set(ref, false);
        }
    }

    //remove those that are no longer visible
    instances.traverseReferences(visitInstancedReference);

    //cull instances that are no longer visible
    for (let i = 0, l = elementsToRemove.length; i < l; i++) {
        const ref = elementsToRemove[i];
        instances.remove(ref);
    }

    const elementData = [];

    const data = this.data;

    //process entities that have become newly visible
    for (let index = visibleElementSet.nextSetBit(0); index !== -1; index = visibleElementSet.nextSetBit(index + 1)) {
        //read transform data for instance
        data.getRow(index, elementData);

        const positionX = elementData[0];
        const positionY = elementData[1];
        const positionZ = elementData[2];

        const encodedRotation = elementData[3];


        const scaleX = elementData[4];
        const scaleY = elementData[5];
        const scaleZ = elementData[6];

        const i = instances.add(index);

        tempQuaternion.decodeFromUint32(encodedRotation);

        //apply instance transforms
        instances.setPositionAt(i, positionX, positionY, positionZ);
        instances.setRotationAt(i, tempQuaternion.x, tempQuaternion.y, tempQuaternion.z, tempQuaternion.w);
        instances.setScaleAt(i, scaleX, scaleY, scaleZ);
    }
};


export { InstancedFoliage };
