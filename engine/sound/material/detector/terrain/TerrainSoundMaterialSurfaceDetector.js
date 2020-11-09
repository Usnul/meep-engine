import { SoundMaterialSurfaceDetector } from "../SoundMaterialSurfaceDetector.js";
import Vector2 from "../../../../../core/geom/Vector2.js";
import { normalizeArrayVector } from "../../../../../core/math/MathUtils.js";
import { SoundMaterialComposition } from "../../concrete/SoundMaterialComposition.js";
import { SilentSoundMaterial } from "../../concrete/SilentSoundMaterial.js";
import { SingleSoundMaterial } from "../../concrete/SingleSoundMaterial.js";
import { deserializeSoundMaterialFromJSON } from "../../concrete/json/deserializeSoundMaterialFromJSON.js";
import { assert } from "../../../../../core/assert.js";

const v2_temp = new Vector2();

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

    loadMaterialsFromJSON(json) {
        assert.isArray(json, 'json');

        for (let i = 0; i < json.length; i++) {
            const jEl = json[i];

            const material = SingleSoundMaterial.fromJSON(jEl);

            this.materials[i] = material;
        }
    }

    /**
     *
     * @param {Terrain} terrain
     */
    initialize(terrain) {
        this.__terrain = terrain;

        // initialize composite material

        const layer_count = terrain.layers.count();

        for (let i = 0; i < layer_count; i++) {

            const terrainLayer = terrain.layers.get(i);

            // attempt to extract information from the layer
            const soundMaterial = terrainLayer.extra.soundMaterial;


            if (soundMaterial === undefined) {
                // no material set
                this.setLayerMaterial(i, SilentSoundMaterial.INSTANCE);
            } else {
                this.setLayerMaterial(i, deserializeSoundMaterialFromJSON(soundMaterial));
            }

        }
    }

    /**
     *
     * @param {number} layer_index
     * @param {AbstractSoundMaterialDefinition} material
     */
    setLayerMaterial(layer_index, material) {
        assert.isNumber(layer_index, 'layer_index');
        assert.isNonNegativeInteger(layer_index, 'layer_index');

        this.materials[layer_index] = material;

        this.__composite.setMaterial(layer_index, material, 1);
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

        const additions = this.__composite.computeInteractionSounds(result, 0, interaction);

        return result;
    }
}
