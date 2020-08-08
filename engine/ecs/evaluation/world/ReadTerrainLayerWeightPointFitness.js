import { PointFitnessFunction } from "../PointFitnessFunction.js";
import { obtainTerrain } from "../../../../../model/game/scenes/SceneUtils.js";
import Vector3 from "../../../../core/geom/Vector3.js";
import Vector2 from "../../../../core/geom/Vector2.js";
import { assert } from "../../../../core/assert.js";


const v3 = new Vector3();
const v2 = new Vector2();

export class ReadTerrainLayerWeightPointFitness extends PointFitnessFunction {
    constructor() {
        super();

        /**
         * Layer index
         * @type {number}
         */
        this.layer = 0;
    }

    /**
     *
     * @param {number} layer
     * @return {ReadTerrainLayerWeightPointFitness}
     */
    static from(layer) {
        assert.isNonNegativeInteger(layer, 'layer');

        const r = new ReadTerrainLayerWeightPointFitness();

        r.layer = layer;

        return r;
    }

    evaluate(ecd, x, y, z) {
        const terrain = obtainTerrain(ecd);

        if (terrain === null) {
            return 0;
        }

        v3.set(x, y, z);

        terrain.mapPointWorld2Grid(v3, v2);

        v2.divide(terrain.size);

        v2.clamp(0, 0, 1, 1);

        /**
         * Result is uint8
         * @type {number}
         */
        const weight_i = terrain.splat.sampleWeight(v2.x, v2.y, this.layer);

        const weight_f = weight_i / 255;

        return weight_f;
    }
}

ReadTerrainLayerWeightPointFitness.prototype.type = "ReadTerrainLayerWeightPointFitness";
