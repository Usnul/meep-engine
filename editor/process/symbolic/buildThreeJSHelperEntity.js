import EntityBuilder from "../../../engine/ecs/EntityBuilder.js";
import Renderable from "../../../engine/ecs/components/Renderable.js";
import { Transform } from "../../../engine/ecs/transform/Transform.js";
import EditorEntity from "../../ecs/EditorEntity.js";
import Script from "../../../engine/ecs/components/Script.js";


/**
 *
 * @param {Object3D} helper
 * @return {EntityBuilder}
 */
export function buildThreeJSHelperEntity(helper) {
    helper.frustumCulled = false;

    const entityBuilder = new EntityBuilder();

    const renderable = new Renderable(helper);
    renderable.matrixAutoUpdate = false;

    entityBuilder.add(new Transform());
    entityBuilder.add(new EditorEntity());
    entityBuilder.add(renderable);


    if (typeof helper.update === "function") {
        entityBuilder.add(new Script(function () {
            helper.update();
        }));
    }

    renderable.computeBoundsFromObject();

    return entityBuilder;
}
