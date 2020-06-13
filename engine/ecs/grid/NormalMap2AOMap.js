/**
 * Created by Alex on 15/11/2014.
 */


import * as THREE from 'three';
import { Sampler2D } from '../../graphics/texture/sampler/Sampler2D.js';
import sampler2D2Texture from '../../graphics/texture/sampler/Sampler2D2Texture.js';
import AmbientOcclusionShader from '../../graphics/shaders/AmbientOcclusionShader.js';
import GaussianBlurShader from '../../graphics/shaders/GaussianBlurShader.js';
import ImageFilter from '../../graphics/filter/ImageFilter.js';
import { sampler2DtoFloat32Texture } from "./sampler2DToFloat32Texture.js";

function filterResult2Texture(data, width, height) {
    const result = new THREE.DataTexture();
    result.format = THREE.RGBAFormat;


    result.type = THREE.UnsignedByteType;
    result.flipY = false;
    result.image = { data: data, width: width, height: height };

    result.wrapS = THREE.ClampToEdgeWrapping;
    result.wrapT = THREE.ClampToEdgeWrapping;

    result.repeat.set(1, 1);
    result.needsUpdate = true;

    result.anisotropy = 4;

    return result;
}

/**
 *
 * @param {WebGLRenderer} renderer
 * @param {Sampler2D} heightMap
 * @param {Sampler2D} normalMap
 * @param {Vector2} resultSize
 * @param {number} [rayLength]
 * @returns {Sampler2D}
 */
function normalMap2OcclusionMap(
    renderer,
    heightMap,
    normalMap,
    resultSize,
    rayLength = 17
) {
    const width = resultSize.x;
    const height = resultSize.y;
    const resolution = new THREE.Vector2(heightMap.width, heightMap.height);
    //
    const normalTexture = sampler2D2Texture(normalMap, 255, 0.5);

    const heightTexture = sampler2DtoFloat32Texture(heightMap);


    //construct shader
    const shaderAO = new AmbientOcclusionShader();
    shaderAO.uniforms.heightMap.value = heightTexture;
    shaderAO.uniforms.normalMap.value = normalTexture;
    shaderAO.uniforms.resolution.value = resolution;
    shaderAO.uniforms.rayLength.value = rayLength;
    //perform filtering
    const rawAO = ImageFilter(renderer, width, height, shaderAO);

    const shaderBlur = new GaussianBlurShader();
    shaderBlur.uniforms.resolution.value = resolution;
    shaderBlur.uniforms.tDiffuse.value = filterResult2Texture(rawAO.array, width, height);
    shaderBlur.uniforms.sigma.value.set(1.3, 1.3);

    const smoothAO = ImageFilter(renderer, width, height, shaderBlur);

    //create the sampler
    const result = new Sampler2D(new Uint8ClampedArray(width * height), 1, width, height);

    //populate samples
    const size = width * height;

    for (let i = 0; i < size; i++) {
        const i4 = i * 4;

        result.data[i] = smoothAO.array[i4];
    }

    return result;
}

export default normalMap2OcclusionMap;
