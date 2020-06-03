import { System } from "../../../ecs/System.js";
import { TopDownCameraLander } from "./TopDownCameraLander.js";
import { Cache } from "../../../../core/Cache.js";
import { obtainTerrain } from "../../../../../model/game/scenes/SceneUtils.js";
import { buildCameraTargetSampler } from "../../../input/ecs/util/TerrainCameraTargetSampler.js";
import Vector3 from "../../../../core/geom/Vector3.js";
import TopDownCameraController from "./TopDownCameraController.js";
import Vector2 from "../../../../core/geom/Vector2.js";
import { SignalBinding } from "../../../../core/events/signal/SignalBinding.js";
import { clamp } from "../../../../core/math/MathUtils.js";


/**
 *
 * @param {Terrain} terrain
 * @param {Cache<number,Sampler2D>} cache
 */
function getSampler(terrain, cache) {

    let sampler = cache.get(terrain.id);

    if (sampler === null) {
        //build new sampler
        const heightSampler = terrain.heightMap;

        if (heightSampler === null) {
            return null;
        }

        sampler = buildCameraTargetSampler({ heightSampler });

        cache.put(terrain.id, sampler);
    }

    return sampler;
}

const v2 = new Vector2();

/**
 *
 * @param {TopDownCameraLander} lander
 * @param {TopDownCameraController} controller
 * @param {Terrain} terrain
 * @param {Cache<number,Sampler2D>} samplerCache
 */
function land(lander, controller, terrain, samplerCache) {

    const sampler = getSampler(terrain, samplerCache);

    if (sampler === null) {
        //no sampler
        return;
    }

    /**
     *
     * @type {Vector3}
     */
    const target = controller.target;


    terrain.mapPointWorld2Grid(target, v2);

    v2.divide(terrain.size);

    const x = clamp(v2.x * sampler.width, 0, sampler.width - 1);
    const y = clamp(v2.y * sampler.height, 0, sampler.height - 1);

    const value = sampler.sampleChannelBilinear(x, y, 0);

    target.setY(value);
}

export class TopDownCameraLanderSystem extends System {
    constructor() {
        super();

        this.componentClass = TopDownCameraLander;

        /**
         *
         * @type {Cache<number,Sampler2D>}
         */
        this.samplerCache = new Cache({ maxWeight: 2 });

        this.dependencies = [TopDownCameraLander, TopDownCameraController];

        /**
         * @private
         * @type {Array}
         */
        this.data = [];
    }

    /**
     *
     * @param {TopDownCameraLander} lander
     * @param {TopDownCameraController} controller
     * @param {number} entity
     */
    link(lander, controller, entity) {
        const doLand = () => {
            const em = this.entityManager;

            const ecd = em.dataset;

            if (ecd === null) {
                return;
            }


            /**
             *
             * @type {Terrain}
             */
            const terrain = obtainTerrain(ecd);

            if (terrain === null) {
                return;
            }


            //TODO add scheduling of landing if any of the prerequisites are missing
            land(lander, controller, terrain, this.samplerCache);
        };

        const binding = new SignalBinding(controller.target.onChanged, doLand);

        binding.link();

        doLand();

        this.data[entity] = binding;
    }

    /**
     *
     * @param {TopDownCameraLander} lander
     * @param {TopDownCameraController} controller
     * @param {number} entity
     */
    unlink(lander, controller, entity) {
        const bindings = this.data[entity];

        if (bindings !== undefined) {
            bindings.unlink();

            delete this.data[entity];
        }
    }

    update(timeDelta) {

    }
}
