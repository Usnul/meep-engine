import { AbstractSoundMaterialDefinition } from "./AbstractSoundMaterialDefinition.js";

export class SilentSoundMaterial extends AbstractSoundMaterialDefinition {
    sounds(destination, destination_offset, interaction) {
        return 0;
    }
}

SilentSoundMaterial.INSTANCE = new SilentSoundMaterial();
