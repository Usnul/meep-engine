import { AbstractSoundMaterialDefinition } from "../AbstractSoundMaterialDefinition.js";
import { randomFromArray } from "../../../../core/math/MathUtils.js";
import { SoundAssetPlaybackSpec } from "../../asset/SoundAssetPlaybackSpec.js";

export class RandomSoundMaterial extends AbstractSoundMaterialDefinition {
    constructor() {
        super();

        /**
         * Options
         * @type {SoundAssetPlaybackSpec[]}
         */
        this.sounds = [];
    }

    computeInteractionSounds(destination, destination_offset, interaction) {
        const spec = randomFromArray(Math.random, this.sounds);

        destination[destination_offset] = spec;

        return 1;
    }

    toJSON() {
        return {
            sounds: this.sounds.map(s => s.toJSON())
        };
    }

    fromJSON({ sounds }) {
        this.sounds = sounds.map(SoundAssetPlaybackSpec.fromJSON);
    }
}

RandomSoundMaterial.typeName = "RandomSoundMaterial";
