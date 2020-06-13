/**
 * Created by Alex on 15/11/2014.
 */

import { Sampler2D } from '../../graphics/texture/sampler/Sampler2D.js';
import NormalMapShader from '../../graphics/shaders/NormalMapShader2.js';
import ImageFilter from '../../graphics/filter/ImageFilter.js';
import { sampler2DtoFloat32Texture } from "./sampler2DToFloat32Texture.js";


function convertChannel(v) {
    return (v) / 255 - 0.5;
}

/**
 *
 * @param {number[]|Uint8Array} source
 * @returns {Float32Array}
 */
function rgbaArray2RGB(source) {
    const length = source.length;
    const numPixels = Math.floor(length / 4);
    const target = new Float32Array(numPixels * 3);
    //
    let h;
    for (let i = 0; i < numPixels; i++) {
        const j = i * 4;
        const k = i * 3;
        //normalize source to normal vectors
        let x = convertChannel(source[j]);
        let y = convertChannel(source[j + 1]);
        let z = convertChannel(source[j + 2]);
        //
        h = Math.sqrt(x * x + y * y + z * z);

        x /= h;
        y /= h;
        z /= h;
        //
        target[k] = x;
        target[k + 1] = y;
        target[k + 2] = z;
    }
    return target;
}

/**
 *
 * @param {WebGLRenderer} renderer
 * @param {Sampler2D} sampler
 * @returns {Sampler2D}
 */
function heightMap2NormalMap(renderer, sampler) {

    const width = sampler.width;
    const height = sampler.height;

    const texture = sampler2DtoFloat32Texture(sampler);

    //construct shader
    const shader = new NormalMapShader();
    shader.uniforms.heightMap.value = texture;
    shader.uniforms.resolution.value.set(width, height);

    //perform filtering
    const result = ImageFilter(renderer, width, height, shader);

    //create the sampler
    const array = result.array;
    const rgb = rgbaArray2RGB(array);

    //reduce array's alpha component
    return new Sampler2D(rgb, 3, width, height);
}

export default heightMap2NormalMap;
