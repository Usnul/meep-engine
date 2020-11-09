/**
 * @template T
 */
export class SoundMaterialSurfaceDetector {
    constructor() {

    }

    /**
     *
     * @param {T} thing
     * @param {Vector3} point
     * @param {SoundMaterialInteractionType} interaction
     * @returns {SoundAssetPlaybackSpec[]}
     */
    detect(thing, point, interaction) {
        throw new Error('Method must be overridden in the implementing class');
    }
}
