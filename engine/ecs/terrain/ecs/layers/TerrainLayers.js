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
import List from "../../../../../core/collection/list/List.js";

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
        const terrainLayers = this.layers;
        const n = terrainLayers.length;

        const texture = this.scalesTexture;

        const image = texture.image;

        const scaleTextureDataLength = n * 2;

        if (image.data.length !== scaleTextureDataLength) {
            image.data = new Float32Array(scaleTextureDataLength);

            image.height = 1;
            image.width = n;
        }

        const data = image.data;


        for (let i = 0; i < n; i++) {
            const layer = terrainLayers.get(i);

            const index2 = i * 2;

            const scale_x = (terrainWidth) / layer.size.x;
            const scale_y = (terrainHeight) / layer.size.y;


            data[index2] = scale_x;
            data[index2 + 1] = scale_y;
        }

        texture.needsUpdate = true;
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
            // TODO introduce scaled sampler cache
            const scaledLayerSampler = new Sampler2D(new Uint8Array(resolution.x * resolution.y * 3), 3, resolution.x, resolution.y);

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
