import { SoundAssetPlaybackSpec } from "../asset/SoundAssetPlaybackSpec.js";
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

    fromJSON({ spec }) {
        this.spec.fromJSON(spec);
    }

    static fromJSON(j) {
        const r = new SingleSoundMaterial();

        r.fromJSON(j);

        return r;
    }
}
