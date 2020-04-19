import { DataTexture2DArray } from "three/src/textures/DataTexture2DArray.js";
import {
    ClampToEdgeWrapping,
    DataTexture,
    FloatType,
    LinearFilter,
    LinearMipMapLinearFilter,
    NearestFilter,
    RepeatWrapping,
    RGBFormat,
    RGFormat,
    UnsignedByteType
} from "three";
import { assert } from "../../../../../core/assert.js";
import Vector2 from "../../../../../core/geom/Vector2.js";
import { TerrainLayer } from "./TerrainLayer.js";
import { Sampler2D } from "../../../../graphics/texture/sampler/Sampler2D.js";
import { scaleSampler2D } from "../../../../graphics/texture/sampler/scaleSampler2D.js";
import { max2 } from "../../../../../core/math/MathUtils.js";
import List from "../../../../../core/collection/List.js";

/**
 *
 * @param {{repeat:Vector2,textures:{diffuse:string[]}}} description
 * @param {TerrainLayers} layers
 * @param {AssetManager} am
 * @param {Vector2} size
 * @param {number} gridScale
 * @returns {Promise}
 */
export function loadLegacyTerrainLayers(description, layers, am, size, gridScale) {

    /**
     *
     * @type {string[]}
     */
    const textures = description.textures.diffuse;

    /**
     *
     * @param {string} url
     * @param {number} layerIndex
     * @return {Promise<Asset>}
     */
    function loadLayer(url, layerIndex) {

        /**
         *
         * @type {TerrainLayer}
         */
        const layer = layers.layers.get(layerIndex);

        layer.textureDiffuseURL = url;

        return layer.loadTextureData(am);
    }

    const layerCount = textures.length;

    for (let i = 0; i < layerCount; i++) {

        const layer = new TerrainLayer();


        const nX = gridScale * (size.x / size.y);
        const nY = gridScale;

        layer.size.set(nX / description.repeat.x, nY / description.repeat.y);

        layer.diffuse = Sampler2D.uint8(3, layers.resolution.x, layers.resolution.y);

        layers.addLayer(layer);
    }

    layers.buildTexture();

    const promises = [];

    for (let i = 0; i < layerCount; i++) {
        const url = textures[i];

        const promise = loadLayer(url, i);

        promises.push(promise);
    }

    function updateResolution() {

        let size_x = 0;
        let size_y = 0;

        for (let i = 0; i < layerCount; i++) {
            const layer = layers.get(i);

            size_x = max2(layer.diffuse.width, size_x);
            size_y = max2(layer.diffuse.height, size_y);
        }

        layers.resolution.set(size_x, size_y);

        layers.buildTexture();
    }

    function writeLayers() {

        layers.writeAllLayersDataIntoTexture();
    }


    return Promise.all(promises)
        .then(() => {
            updateResolution();

            writeLayers();
        });
}

export class TerrainLayers {
    constructor() {

        /**
         *
         * @type {List<TerrainLayer>}
         */
        this.layers = new List();

        /**
         *
         * @type {Vector2}
         */
        this.resolution = new Vector2(512, 512);

        /**
         *
         * @type {DataTexture2DArray}
         */
        this.texture = new DataTexture2DArray(new Uint8Array(3), 1, 1, 1);
        this.texture.format = RGBFormat;
        this.texture.type = UnsignedByteType;

        this.texture.wrapS = RepeatWrapping;
        this.texture.wrapT = RepeatWrapping;

        this.texture.anisotropy = 8;

        this.texture.magFilter = LinearFilter;
        this.texture.minFilter = LinearMipMapLinearFilter;

        this.texture.generateMipmaps = true;

        this.scalesTexture = new DataTexture(new Float32Array(512), 256, 1, RGFormat, FloatType);

        this.scalesTexture.wrapS = ClampToEdgeWrapping;
        this.scalesTexture.wrapT = ClampToEdgeWrapping;

        this.scalesTexture.minFilter = LinearFilter;
        this.scalesTexture.magFilter = NearestFilter;

        this.scalesTexture.internalFormat = 'RG32F';

        this.scalesTexture.generateMipmaps = false;
    }

    /**
     *
     * @param {number} terrainWidth
     * @param {number} terrainHeight
     */
    updateLayerScales(terrainWidth, terrainHeight) {
        const data = this.scalesTexture.image.data;

        const terrainLayers = this.layers;
        const n = terrainLayers.length;

        for (let i = 0; i < n; i++) {
            const layer = terrainLayers.get(i);

            const index2 = i * 2;

            const scale_x = (terrainWidth) / layer.size.x;
            const scale_y = (terrainHeight) / layer.size.y;


            data[index2] = scale_x;
            data[index2 + 1] = scale_y;
        }

        this.scalesTexture.needsUpdate = true;
    }

    /**
     *
     * @param {AssetManager} assetManager
     * @returns {Promise}
     */
    loadTextureData(assetManager) {
        const n = this.layers.length;

        const promises = [];

        for (let i = 0; i < n; i++) {
            const layer = this.layers.get(i);

            const promise = layer.loadTextureData(assetManager);

            const layerIndex = i;

            promise.then(() => {
                this.writeLayerDataIntoTexture(layerIndex);
            });

            promises.push(promise);
        }

        return Promise.all(promises);
    }

    writeAllLayersDataIntoTexture() {
        for (let i = 0; i < this.layers.length; i++) {
            this.writeLayerDataIntoTexture(i);
        }
    }

    /**
     *
     * @param {number} index
     * @return {TerrainLayer}
     */
    get(index) {
        return this.layers.get(index);
    }

    /**
     *
     * @return {number}
     */
    count() {
        return this.layers.length;
    }

    /**
     *
     * @param {TerrainLayer} layer
     * @returns {number}
     */
    addLayer(layer) {
        assert.defined(layer);

        const index = this.layers.length;

        this.layers.add(layer);

        return index;
    }

    /**
     *
     * @param {number} index
     */
    writeLayerDataIntoTexture(index) {
        /**
         *
         * @type {TerrainLayer}
         */
        const layer = this.get(index);

        const image = this.texture.image;

        const arrayData = image.data;

        const resolution = this.resolution;

        const singleLayerByteSize = resolution.x * resolution.y * 3;

        const address = singleLayerByteSize * index;

        const layerSampler = layer.diffuse;

        assert.equal(layerSampler.itemSize, 3, 'layer sampler must have 3 channels');

        if (layerSampler.width === resolution.x && layerSampler.height === resolution.y) {
            //layer's data matches texture dimensions, we can just copy the data directly
            arrayData.set(layerSampler.data, address);
        } else {
            const scaledLayerSampler = new Sampler2D(new Uint8ClampedArray(resolution.x * resolution.y * 3), 3, resolution.x, resolution.y);

            scaleSampler2D(layerSampler, scaledLayerSampler);

            arrayData.set(scaledLayerSampler.data, address);
        }


        //mark texture for update
        this.texture.needsUpdate = true;
    }

    clear() {
        this.layers.reset();
    }


    buildTexture() {
        const image = this.texture.image;

        //figure out the largest layer size
        const size_x = this.resolution.x;
        const size_y = this.resolution.y;


        const terrainLayers = this.layers;

        const layerCount = terrainLayers.length;


        if (image.width === size_x && image.height === size_y && image.depth === layerCount) {
            //already the right size
            return;
        }

        //build an array to hold texture array
        const arrayData = new Uint8Array(size_x * size_y * 3 * layerCount);


        image.data = arrayData;
        image.width = size_x;
        image.height = size_y;
        image.depth = layerCount;

        this.texture.needsUpdate = true;
    }
}
