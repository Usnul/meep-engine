import { AbstractSoundMaterialDefinition } from "./AbstractSoundMaterialDefinition.js";
import { assert } from "../../../core/assert.js";

/**
 *
 * @type {SoundAssetPlaybackSpec[]}
 */
const temp = [];

export class SoundMaterialComposition extends AbstractSoundMaterialDefinition {
    constructor() {
        super();

        /**
         *
         * @type {AbstractSoundMaterialDefinition[]}
         */
        this.materials = [];
        /**
         *
         * @type {number[]}
         */
        this.weights = [];

        /**
         * Sounds below this threshold are cut from the composition
         * @type {number}
         * @private
         */
        this.__volume_threshold = 0.01;
    }

    /**
     *
     * @param {number} index
     * @param {AbstractSoundMaterialDefinition} material
     * @param {number} weight
     */
    setMaterial(index, material, weight) {
        this.materials[index] = material;
        this.weights[index] = weight;
    }

    /**
     *
     * @param {number} v
     */
    setVolumeThreshold(v) {

        assert.isNumber(v, 'v');
        assert.notNaN(v, 'v');

        this.__volume_threshold = v;
    }

    sounds(destination, destination_offset, interaction) {

        let offset = destination_offset;

        for (let i = 0; i < this.materials.length; i++) {
            const def = this.materials[i];
            const weight = this.weights[i];

            const additions = def.sounds(temp, 0, interaction);

            // adjust based on weights
            for (let j = 0; j < additions; j++) {
                const source = temp[j];

                const destination_volume = source.volume * weight;

                if (destination_volume < this.__volume_threshold) {
                    continue;
                }

                const target = source.clone();

                target.multiplyVolume(weight);

                destination[offset] = target;

                offset++;
            }
        }

        return offset - destination_offset;
    }
}
