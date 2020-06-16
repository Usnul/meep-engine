/**
 * Created by Alex on 01/04/2014.
 */


import { LeafNode } from "../../../core/bvh2/LeafNode.js";
import { AABB3 } from "../../../core/bvh2/AABB3.js";
import { Vector3 as ThreeVector3 } from "three/src/math/Vector3.js";
import { max2, min2 } from "../../../core/math/MathUtils.js";

function Renderable(object) {
    this.object = object;

    this.boundingBox = new AABB3(0, 0, 0, 0, 0, 0);

    this.bvh = new LeafNode(object, 0, 0, 0, 0, 0, 0);

    /**
     *
     * @type {boolean}
     */
    this.matrixAutoUpdate = true;
}

Renderable.prototype.computeBoundsFromObject = function () {
    const object = this.object;

    let x0 = Infinity,
        y0 = Infinity,
        z0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity,
        z1 = -Infinity;

    object.updateMatrixWorld(false, true);

    object.traverse(function (object) {
        if (object.isLine || object.isMesh) {


            const geometry = object.geometry;

            geometry.computeBoundingBox();

            const boundingBox = geometry.boundingBox;

            object.updateMatrixWorld();

            const worldMatrix = object.matrixWorld;

            const bbMin = boundingBox.min;
            const bbMax = boundingBox.max;
            const corners = [
                new ThreeVector3(bbMin.x, bbMin.y, bbMin.z),
                new ThreeVector3(bbMin.x, bbMin.y, bbMax.z),
                new ThreeVector3(bbMin.x, bbMax.y, bbMin.z),
                new ThreeVector3(bbMin.x, bbMax.y, bbMax.z),
                new ThreeVector3(bbMax.x, bbMin.y, bbMin.z),
                new ThreeVector3(bbMax.x, bbMin.y, bbMax.z),
                new ThreeVector3(bbMax.x, bbMax.y, bbMin.z),
                new ThreeVector3(bbMax.x, bbMax.y, bbMax.z),
            ];


            corners.forEach((corner) => {
                corner.applyMatrix4(worldMatrix);

                x0 = min2(x0, corner.x);
                y0 = min2(y0, corner.y);
                z0 = min2(z0, corner.z);

                x1 = max2(x1, corner.x);
                y1 = max2(y1, corner.y);
                z1 = max2(z1, corner.z);
            });
        }
    });


    this.boundingBox.setBounds(x0, y0, z0, x1, y1, z1);

    this.bvh.resize(x0, y0, z0, x1, y1, z1);
};

Renderable.typeName = "Renderable";

Renderable.serializable = false;

export default Renderable;
