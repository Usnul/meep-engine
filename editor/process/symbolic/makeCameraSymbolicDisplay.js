import { make3DSymbolicDisplay } from "./make3DSymbolicDisplay.js";
import { CameraHelper } from "three";
import { buildThreeJSHelperEntity } from "./buildThreeJSHelperEntity.js";
import Renderable from "../../../engine/ecs/components/Renderable.js";
import { Camera } from "../../../engine/graphics/ecs/camera/Camera.js";
import { Transform } from "../../../engine/ecs/transform/Transform.js";

/**
 *
 * @returns {ComponentSymbolicDisplay}
 * @param {Engine} engine
 */
export function makeCameraSymbolicDisplay(engine) {

    return make3DSymbolicDisplay({
        engine,
        factory([camera, transform, entity], api) {
            const helper = new CameraHelper(camera.object);

            const entityBuilder = buildThreeJSHelperEntity(helper);

            const r = entityBuilder.getComponent(Renderable);

            r.matrixAutoUpdate = false;

            return entityBuilder;
        },
        components: [Camera, Transform]
    });
}
