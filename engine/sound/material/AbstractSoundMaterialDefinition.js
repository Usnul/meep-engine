export class AbstractSoundMaterialDefinition {
    constructor() {
    }

    /**
     *
     * @param {SoundAssetPlaybackSpec[]} destination
     * @param {number} destination_offset
     * @param {SoundMaterialInteractionType} interaction
     * @returns {number}
     */
    sounds(destination, destination_offset, interaction) {
        throw new Error('Implementation must override this method');
    }
}
