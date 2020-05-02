import { assert } from "../../../../core/assert.js";

/**
 *
 * @param {Sampler2D} source
 * @param {Sampler2D} target
 */
export function scaleSampler2D(source, target) {
    assert.equal(source.itemSize, target.itemSize, 'both source and target must have the same number of channels');

    const targetWidth = target.width;
    const targetHeight = target.height;
    const sourceWidth = source.width;
    const sourceHeight = source.height;
    if (sourceWidth === targetWidth && sourceHeight === targetHeight) {
        // exact size match
        target.data.set(source.data);
        return;
    }

    const sample = [];

    for (let y = 0; y < targetHeight; y++) {

        const v = y / targetHeight;

        for (let x = 0; x < targetWidth; x++) {

            const u = x / targetWidth;

            source.sampleBilinear(u * sourceWidth, v * sourceHeight, sample);

            target.set(x, y, sample);

        }
    }
}
