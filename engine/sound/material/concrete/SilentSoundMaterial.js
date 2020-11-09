import { AbstractSoundMaterialDefinition } from "../AbstractSoundMaterialDefinition.js";

export class SilentSoundMaterial extends AbstractSoundMaterialDefinition {
    computeInteractionSounds(destination, destination_offset, interaction) {
        return 0;
    }

    toJSON() {
        return {};
    }

    fromJSON() {
        // do nothing
    }
}

SilentSoundMaterial.typeName = "SilentSoundMaterial";


SilentSoundMaterial.INSTANCE = new SilentSoundMaterial();
