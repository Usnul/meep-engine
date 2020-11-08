import { SoundMaterialSurfaceDetector } from "../SoundMaterialSurfaceDetector.js";
import Vector2 from "../../../../core/geom/Vector2.js";
import { normalizeArrayVector } from "../../../../core/math/MathUtils.js";
import { SoundMaterialComposition } from "../SoundMaterialComposition.js";

const v2_temp = new Vector2();

/**
 *
 * @type {number[]}
 */
const weights_temp = [];

export class TerrainSoundMaterialSurfaceDetector extends SoundMaterialSurfaceDetector {
    constructor() {
        super();


        /**
         *
         * @type {AbstractSoundMaterialDefinition[]}
         */
        this.materials = [];

        /**
         *
         * @type {Terrain}
         * @private
         */
        this.__terrain = null;


        /**
         *
         * @type {SoundMaterialComposition}
         * @private
         */
        this.__composite = new SoundMaterialComposition();
    }

    /**
     *
     * @param {Terrain} terrain
     */
    initialize(terrain) {
        this.__terrain = terrain;
    }

    /**
     *
     * @param {number} layer_index
     * @param {AbstractSoundMaterialDefinition} material
     */
    setLayerMaterial(layer_index, material) {
        this.materials[layer_index] = material;

        this.__composite.materials[layer_index] = material;
    }

    detect(thing, point, interaction) {

        this.__terrain.mapPointWorld2Grid(point, v2_temp);

        const u = v2_temp.x / this.__terrain.size.x;
        const v = v2_temp.y / this.__terrain.size.y;

        const layer_count = this.__terrain.layers.count();

        const result = [];


        for (let i = 0; i < layer_count; i++) {

            const weight = this.__terrain.splat.sampleWeight(u, v, i);

            this.__composite.weights[i] = weight;

        }

        normalizeArrayVector(this.__composite.weights, layer_count);

        const additions = this.__composite.sounds(result, 0, interaction);

        return result;
    }
}
