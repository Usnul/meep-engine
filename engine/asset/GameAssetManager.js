/**
 * Created by Alex on 03/09/2014.
 */

import {
    BufferGeometry,
    Geometry,
    MeshLambertMaterial as ThreeMeshLambertMaterial,
    MultiMaterial as ThreeMultiMaterial,
    sRGBEncoding,
    TextureLoader as ThreeTextureLoader
} from 'three';

import checkerTexture from '../graphics/texture/CheckersTexture.js';
import ThreeFactory from '../graphics/three/ThreeFactory.js';

import { load as loadGLTF } from './loaders/GLTFAssetLoader.js';
import { Asset } from "./Asset.js";
import { computeFileExtension } from "../../core/FilePath.js";
import { DDSLoader } from "three/examples/jsm/loaders/DDSLoader.js";
import { loadArrayBuffer } from "./loaders/ArrayBufferLoader.js";
import { JsonAssetLoader } from "./loaders/JsonAssetLoader.js";
import { GameAssetType } from "./GameAssetType.js";
import { TextAssetLoader } from "./loaders/TextAssetLoader.js";
import { LegacyJSONLoader } from "../graphics/loader/threejs/LegacyJSONLoader.js";
import { AnimationGraphDefinitionAssetLoader } from "../graphics/ecs/animation/animator/graph/definition/serialization/AnimationGraphDefinitionAssetLoader.js";
import { JavascriptAssetLoader } from "./loaders/JavascriptAssetLoader.js";
import { ImageRGBADataLoader } from "./loaders/ImageRGBADataLoader.js";

const placeholderTexture = checkerTexture.create();

const placeholderMaterial = new ThreeMeshLambertMaterial({ map: placeholderTexture });

/**
 *
 * @param  {Geometry|BufferGeometry} geometry
 * @returns {boolean}
 */
function isSkinnedGeometry(geometry) {
    return geometry.skinIndices !== void 0 && geometry.skinIndices.length > 0;
}

function loadThreeJSON(path, callback, onError, progress) {

    console.warn(`JSON loader is deprecated. Attempting to load model '${path}'`);

    const loader = new LegacyJSONLoader();

    loader.load(path, function (geometry, materials) {
        //is it skinned?
        const isSkinned = isSkinnedGeometry(geometry);
        if (materials === undefined) {
            materials = [
                placeholderMaterial
            ];
        }
        if (isSkinned) {
            materials.forEach(function (material) {
                material.skinning = true;
            });
        }
        //check for transparent materials
        materials.forEach(function (material) {
            if (material.opacity <= 0) {
                console.warn("Fully transparent material " + material + " of model " + path);
            }
            //fix shininess of 0
            if (material.shininess !== undefined && material.shininess <= 0) {
                //see https://github.com/mrdoob/three.js/pull/8429/files
                material.shininess = 1e-4;
                material.needsUpdate = true;
            }
        });
        let faceMaterial = null;

        if (materials.length === 1) {
            faceMaterial = materials[0];
        } else {
            console.log(path, ' uses MultiMaterial', materials);
            faceMaterial = new ThreeMultiMaterial(materials);
        }

        ThreeFactory.prepareMaterial(faceMaterial);

        let bufferGeometry;
        if (geometry instanceof BufferGeometry) {
            bufferGeometry = geometry;
        } else if (geometry instanceof Geometry) {
            //Convert plain old geometry to a BufferGeometry for better performance
            bufferGeometry = new BufferGeometry();
            bufferGeometry.fromGeometry(geometry);
            if (geometry.animations !== undefined) {
                bufferGeometry.animations = geometry.animations;
            }
            if (geometry.bones !== undefined) {
                bufferGeometry.bones = geometry.bones;
            }
        } else {
            throw new Error(`Unexpected geometry type`);
        }

        bufferGeometry.computeBoundingSphere();
        bufferGeometry.computeBoundingBox();

        const asset = new Asset(function () {
            let mesh;
            if (isSkinned) {
                mesh = ThreeFactory.createSkinnedMesh(bufferGeometry, faceMaterial);
            } else {
                mesh = ThreeFactory.createMesh(bufferGeometry, faceMaterial);
            }
            mesh.castShadow = true;
            mesh.receiveShadow = false;
            //
            return mesh;
        }, 1);

        callback(asset);
    }, progress, onError);
}

function loadSVG(url, callback, progress) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.addEventListener('load', function () {
        if (xhr.readyState === xhr.DONE && xhr.status === 200) {
            const domParser = new DOMParser();
            const domXML = domParser.parseFromString(xhr.responseText, 'image/svg+xml');
            let svgRoot = domXML.children[0];
            const asset = {
                create: function () {
                    return svgRoot.cloneNode(true);
                }
            };
            callback(asset);
        }
    }, false);

    xhr.addEventListener('error', function () {
        console.error(xhr);
    }, false);

    xhr.send();

}


function loadDDSTexture(path, success, failure, progress) {
    function computeByteSize(texture) {
        let result = 0;
        const images = texture.image;
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const mipmaps = image.mipmaps;
            for (let j = 0; j < mipmaps.length; j++) {
                const mipmap = mipmaps[j];
                /**
                 * @type {Uint8Array}
                 */
                const data = mipmap.data;
                result += data.length;
            }
        }
        return result;
    }

    const loader = new DDSLoader();
    loader.load(path, function (texture) {
        const byteSize = computeByteSize(texture);

        function factory() {
            return cloneTexture(texture);
        }

        const asset = new Asset(factory, byteSize);

        success(asset);

    }, progress, failure);
}

/**
 *
 * @param {Texture} t
 * @returns {Texture}
 */
function cloneTexture(t) {
    const clone = t.clone();

    //apparently cloned textures need this trick to work
    clone.needsUpdate = true;

    return clone;
}

const textureLoader = new ThreeTextureLoader();
const ddsLoader = new DDSLoader();

function loadStandardImageTexture(path, success, failure, progress) {

    /**
     *
     * @param {Texture} texture
     * @return {number}
     */
    function computeByteSize(texture) {
        const image = texture.image;
        if (image instanceof ImageData) {
            return image.array.length;
        } else {
            //TODO do actual computation
            //don't know
            return 1;
        }
    }


    textureLoader.load(path, function (texture) {

        texture.flipY = false;

        const byteSize = computeByteSize(texture);

        const asset = new Asset(function () {
            return cloneTexture(texture);
        }, byteSize);

        success(asset);
    }, progress, failure);
}

/**
 *
 * @param {string} path
 * @param {function} success
 * @param {function} failure
 * @param {function} progress
 */
function loadTexture(path, success, failure, progress) {
    //figure out what kind of a texture it is
    const fileExtension = computeFileExtension(path);
    if (fileExtension === null) {
        throw new Error(`no file extension on path '${path}'`);
    }

    const lowerCaseExtension = fileExtension.toLowerCase();
    switch (lowerCaseExtension) {
        case  'dds':
            loadDDSTexture(path, success, failure, progress);
            break;
        case 'png':
        case 'jpg':
            loadStandardImageTexture(path, success, failure, progress);
            break;
        default:
            throw new Error(`Unsupported texture file format: '${lowerCaseExtension}'`);

    }

}


function deferredTextureLoader(path, success, failure, progress) {

    /**
     *
     * @param {Texture} texture
     * @return {number}
     */
    function computeByteSize(texture) {
        const image = texture.image;
        if (image instanceof ImageData) {
            return image.array.length;
        } else {
            //TODO do actual computation
            //don't know
            return 1;
        }
    }

    /**
     *
     * @param {Texture} texture
     */
    function handleLoad(texture) {
        const byteSize = computeByteSize(texture);

        asset.byteSize = byteSize;

        pending.forEach(p => {
            p.image = texture.image;
            p.mipmaps = texture.mipmaps;

            p.format = texture.format;

            p.needsUpdate = true;
        });

        isLoaded = true;
    }

    function loadCompressed() {
        const texture = ddsLoader.load(path, handleLoad, progress, failure);

        if (texture.mipmaps === undefined) {
            texture.mipmaps = [];
        }

        return texture;
    }

    const pending = [];

    let isLoaded = false;

    //figure out what kind of a texture it is
    const fileExtension = computeFileExtension(path);
    if (fileExtension === null) {
        throw new Error(`no file extension on path '${path}'`);
    }

    const lowerCaseExtension = fileExtension.toLowerCase();

    let texture;

    switch (lowerCaseExtension) {
        case  'dds':
            texture = loadCompressed();
            break;
        case 'png':
        case 'jpg':
            texture = textureLoader.load(path, handleLoad, progress, failure);
            break;
        default:
            throw new Error(`Unsupported texture file format: '${lowerCaseExtension}'`);

    }

    texture.encoding = sRGBEncoding;

    const asset = new Asset(function () {

        const clone = texture.clone();

        if (isLoaded) {
            clone.needsUpdate = true;
        } else {
            pending.push(clone);
        }

        return clone;
    }, 1);

    success(asset);
}


/**
 *
 * @param {AssetManager} assetManager
 */
function initAssetManager(assetManager) {

    assetManager.registerLoader(GameAssetType.ModelGLTF, loadGLTF);
    assetManager.registerLoader(GameAssetType.ModelGLTF_JSON, loadGLTF);
    assetManager.registerLoader(GameAssetType.ModelThreeJs, loadThreeJSON);
    assetManager.registerLoader(GameAssetType.ArrayBuffer, loadArrayBuffer);
    assetManager.registerLoader(GameAssetType.Texture, loadTexture);
    assetManager.registerLoader(GameAssetType.DeferredTexture, deferredTextureLoader);

    assetManager.registerLoader(GameAssetType.JSON, JsonAssetLoader);
    assetManager.registerLoader(GameAssetType.Text, TextAssetLoader);

    assetManager.registerLoader(GameAssetType.JavaScript, new JavascriptAssetLoader());


    assetManager.registerLoader(GameAssetType.AnimationGraph, new AnimationGraphDefinitionAssetLoader());

    assetManager.registerLoader(GameAssetType.Image, new ImageRGBADataLoader());

    assetManager.registerLoader(GameAssetType.ImageSvg, loadSVG);
}

/**
 *
 * @param {string} url
 * @returns {string|null}
 */
export function guessAssetType(url) {
    const ext = computeFileExtension(url);
    const assetRootPath = 'data/';

    let assetDirectory = url.substring(url.indexOf(assetRootPath) + assetRootPath.length);

    while (assetDirectory.charAt(0) === "/") {
        assetDirectory = assetDirectory.substr(1);
    }
    let iSlash = assetDirectory.indexOf("/");
    if (iSlash === -1) {
        assetDirectory = "";
    } else {
        assetDirectory = assetDirectory.substr(0, iSlash);
    }
    switch (ext) {
        case "json":
            switch (assetDirectory) {
                case "models":
                    return "three.js";
                case "levels":
                    return "level";
                default:
                    return "json";
            }
        case 'gltf':
            return 'model/gltf+json';
        case 'glb':
            return 'model/gltf';
        case "jpg":
        case "jpeg":
        case "png":
            return "image";
        case "ogg":
        case "mp3":
        //NOTE currently chrome doesn't seem to load these
        // return "sound";
        default :
            return null;
    }
}

export {
    initAssetManager
};
