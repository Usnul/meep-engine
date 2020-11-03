import { MarkerNodeEntityProcessor } from "./MarkerNodeEntityProcessor.js";
import { obtainTerrain } from "../../../../../model/game/scenes/SceneUtils.js";
import { SurfacePoint3 } from "../../../../core/geom/3d/SurfacePoint3.js";
import { Transform } from "../../../../engine/ecs/transform/Transform.js";
import { alignToVector } from "../../../../engine/ecs/terrain/ecs/ClingToTerrainSystem.js";

const p = new SurfacePoint3();

export class MarkerNodeEntityProcessorClingToTerrain extends MarkerNodeEntityProcessor {
    constructor() {
        super();

        /**
         * @private
         * @type {Terrain}
         */
        this.terrain = null;

        /**
         *
         * @type {boolean}
         */
        this.normalAlign = false;
    }

    /**
     *
     * @param {boolean} [normalAlign=false]
     * @return {MarkerNodeEntityProcessorClingToTerrain}
     */
    static from({ normalAlign = false } = {}) {
        const r = new MarkerNodeEntityProcessorClingToTerrain();

        r.normalAlign = normalAlign;

        return r;
    }

    initialize(data, ecd) {
        this.terrain = obtainTerrain(ecd);
    }

    execute(entity, node, data, ecd) {
        const transform = entity.getComponent(Transform);

        const contact_found = this.terrain.raycastVerticalFirstSync(p, transform.position.x, transform.position.z);

        if (contact_found) {
            transform.position.setY(p.position.y);

            if (this.normalAlign) {
                alignToVector(transform.rotation, p.normal, 1000);
            }

        }

    }
}
