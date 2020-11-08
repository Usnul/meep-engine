import { AbstractSoundMaterialDefinition } from "./AbstractSoundMaterialDefinition.js";

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

                const target = source.clone();

                target.multiplyVolume(weight);

                destination[offset] = target;

                offset++;
            }
        }

        return offset - destination_offset;
    }
}
