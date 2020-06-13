import { ClampToEdgeWrapping, DataTexture, FloatType, LinearFilter, NearestFilter, RedFormat } from "three";
import { assert } from "../../../core/assert.js";

/**
 *
 * @param {Sampler2D} sampler
 * @returns {DataTexture}
 */
export function sampler2DtoFloat32Texture(sampler) {
    assert.ok(sampler.data instanceof Float32Array);

    const width = sampler.width;
    const height = sampler.height;

    const texture = new DataTexture(sampler.data, width, height, RedFormat, FloatType);

    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;

    texture.generateMipmaps = false;

    texture.minFilter = LinearFilter;
    texture.magFilter = NearestFilter;

    texture.flipY = false;

    texture.internalFormat = 'R32F';

    return texture;
}
