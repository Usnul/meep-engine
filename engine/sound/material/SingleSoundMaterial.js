import { SoundAssetPlaybackSpec } from "../SoundAssetPlaybackSpec.js";
import { AbstractSoundMaterialDefinition } from "./AbstractSoundMaterialDefinition.js";

export class SingleSoundMaterial extends AbstractSoundMaterialDefinition {
    constructor() {
        super();

        this.spec = new SoundAssetPlaybackSpec();

    }

    sounds(destination, destination_offset, interaction) {
        destination[destination_offset] = this.spec;

        return 1;
    }
}
