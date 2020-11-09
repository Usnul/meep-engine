import { AbstractSoundMaterialDefinition } from "../AbstractSoundMaterialDefinition.js";
import { randomFromArray } from "../../../../core/math/MathUtils.js";
import { serializeSoundMaterialToJSON } from "./json/serializeSoundMaterialToJSON.js";
import { deserializeSoundMaterialFromJSON } from "./json/deserializeSoundMaterialFromJSON.js";

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
            sounds: this.sounds.map(serializeSoundMaterialToJSON)
        };
    }

    fromJSON({ sounds }) {
        this.sounds = sounds.map(deserializeSoundMaterialFromJSON);
    }
}

RandomSoundMaterial.typeName = "RandomSoundMaterial";
