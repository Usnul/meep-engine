import { Light } from "../../../engine/graphics/ecs/light/Light.js";
import { DirectionalLightHelper, PointLightHelper, SpotLightHelper } from "three";
import { make3DSymbolicDisplay } from "./make3DSymbolicDisplay.js";
import { buildThreeJSHelperEntity } from "./buildThreeJSHelperEntity.js";
import Renderable from "../../../engine/ecs/components/Renderable.js";
import { Transform } from "../../../engine/ecs/transform/Transform.js";

/**
 *
 * @param {Engine} engine
 * @returns {ComponentSymbolicDisplay}
 */
export function makeLightSymbolicDisplay(engine) {

    /**
     *
     * @param {Light} light
     */
    function makeHelper(light) {
        const threeObject = light.__threeObject;

        if (threeObject === null) {
            console.warn('Light object is not initialized', light);
            return null;
        }
        if (threeObject === undefined) {
            console.error('Light object is undefined', light);
            return null;
        }

        switch (light.type.getValue()) {
            case Light.Type.SPOT:
                return new SpotLightHelper(threeObject);
            case  Light.Type.POINT:
                return new PointLightHelper(threeObject);
            case Light.Type.DIRECTION:
                return new DirectionalLightHelper(threeObject);

            default:
                return null;
        }
    }

    return make3DSymbolicDisplay({
        engine,

        factory([light, transform, entity], api) {

            const helper = makeHelper(light);

            if (helper === null) {
                //no helper for this light type
                return;
            }

            const entityBuilder = buildThreeJSHelperEntity(helper);

            const r = entityBuilder.getComponent(Renderable);

            r.matrixAutoUpdate = false;

            api.bind(light.type.onChanged, api.update, api);

            return entityBuilder;
        },

        components: [Light, Transform]
    });
}
