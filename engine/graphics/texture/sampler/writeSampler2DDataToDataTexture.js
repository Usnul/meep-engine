import { LuminanceFormat, RedFormat, RGBAFormat, RGBFormat, RGFormat } from "three";

/**
 *
 * @param {Sampler2D} sampler
 * @param {DataTexture} texture
 */
export function writeSample2DDataToDataTexture(sampler, texture) {
    if (sampler.itemSize === 1) {
        if (texture.format !== RedFormat && texture.format !== LuminanceFormat) {
            throw new Error('itemSize is 1 and texture.format is not RedFormat');
        }
    } else if (sampler.itemSize === 2) {
        if (texture.format !== RGFormat) {
            throw new Error('itemSize is 2 and texture.format is not RGFormat');
        }
    } else if (sampler.itemSize === 3) {
        if (texture.format !== RGBFormat) {
            throw new Error('itemSize is 2 and texture.format is not RGBFormat');
        }
    } else if (sampler.itemSize === 4) {
        if (texture.format !== RGBAFormat) {
            throw new Error('itemSize is 2 and texture.format is not RGBAFormat');
        }
    } else {
        throw new Error('Unsupported itemSize');
    }

    texture.image.data = sampler.data;
    texture.image.width = sampler.width;
    texture.image.height = sampler.height;

    texture.needsUpdate = true;
}
