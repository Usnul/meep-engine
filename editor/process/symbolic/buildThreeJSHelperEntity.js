import EntityBuilder from "../../../engine/ecs/EntityBuilder.js";
import Renderable from "../../../engine/ecs/components/Renderable.js";
import { Transform } from "../../../engine/ecs/components/Transform.js";
import EditorEntity from "../../ecs/EditorEntity.js";
import Script from "../../../engine/ecs/components/Script.js";
import { Vector3 as ThreeVector3 } from "three";
import { max2, min2 } from "../../../core/math/MathUtils.js";


/**
 *
 * @param {Object3D} helper
 * @return {EntityBuilder}
 */
export function buildThreeJSHelperEntity(helper) {
    helper.frustumCulled = false;

    const entityBuilder = new EntityBuilder();

    const renderable = new Renderable(helper);

    entityBuilder.add(new Transform());
    entityBuilder.add(new EditorEntity());
    entityBuilder.add(renderable);
    entityBuilder.add(new Script(function () {
        let x0 = Infinity,
            y0 = Infinity,
            z0 = Infinity,
            x1 = -Infinity,
            y1 = -Infinity,
            z1 = -Infinity;

        if (typeof helper.update === "function") {
            helper.update();
        }

        helper.updateMatrixWorld(false, true);

        helper.traverse(function (object) {
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


        renderable.boundingBox.setBounds(x0, y0, z0, x1, y1, z1);

        renderable.bvh.resize(x0, y0, z0, x1, y1, z1);
    }));


    return entityBuilder;
}
