import { DataTexture, DataTexture2DArray, LinearFilter, NearestFilter, RedFormat, UnsignedByteType } from "three";
import Vector2 from "../../../../../core/geom/Vector2.js";
import { GameAssetType } from "../../../../asset/GameAssetType.js";
import { Sampler2D } from "../../../../graphics/texture/sampler/Sampler2D.js";
import { SplatMapOptimizer } from "./SplatMapOptimizer.js";
import { assert } from "../../../../../core/assert.js";
import { max2, min2 } from "../../../../../core/math/MathUtils.js";
import { scaleSampler2D } from "../../../../graphics/texture/sampler/scaleSampler2D.js";
import { countTask } from "../../../../../core/process/task/TaskUtils.js";


/**
 *
 * @param {{textures:{splat:string[]}}} description
 * @param {SplatMapping} mapping
 * @param {AssetManager} am
 * @returns {Promise}
 */
export function loadLegacyTerrainSplats(description, mapping, am) {


    const textures = description.textures.splat;

    const n = textures.length;

    /**
     *
     * @param {string} url
     * @param {number} index
     * @return {Promise<Asset>}
     */
    function loadSplat(url, index) {

        return am.promise(url, GameAssetType.Image)
            .then(asset => {

                const image = asset.create();

                // FIXME texture array in three.js doesn't work when texture size is less than 4x4
                const width = max2(image.width, 4);
                const height = max2(image.height, 4);

                //create a sampler
                const source = new Sampler2D(image.data, 4, image.width, image.height);

                mapping.resize(width, height, 4);


                const weightData = mapping.weightData;

                const dataOffset = index * width * height;

                const sourceWidth = source.width;
                const sourceHeight = source.height;

                const source_max_y = sourceHeight - 1;
                const source_max_x = sourceWidth - 1;

                for (let y = 0; y < height; y++) {
                    const v = y / height;

                    for (let x = 0; x < width; x++) {

                        const u = x / width;

                        const targetIndex = y * width + x;
                        const targetAddress = dataOffset + targetIndex;

                        const value = source.sampleChannelBilinear(u * source_max_x, v * source_max_y, 0);

                        weightData[targetAddress] = value;
                    }
                }

            });
    }

    const weightPromises = [];

    for (let i = 0; i < n; i++) {
        const url = textures[i];

        const promise = loadSplat(url, i);

        weightPromises.push(promise);
    }

    return Promise.all(weightPromises)
        .then(() => {
            const materialData = mapping.materialData;

            const n = materialData.length;

            for (let i = 0; i < n; i += 4) {
                materialData[i] = 0;
                materialData[i + 1] = 1;
                materialData[i + 2] = 2;
                materialData[i + 3] = 3;
            }

            mapping.materialTexture.needsUpdate = true;
            mapping.weightTexture.needsUpdate = true;

        });
}

/**
 * Represents how various materials are mixed across the terrain
 */
export class SplatMapping {
    constructor() {
        /**
         * How large is the map
         * @type {Vector2}
         */
        this.size = new Vector2(512, 512);

        /**
         *
         * @type {number}
         */
        this.depth = 1;

        const size = this.size;

        const width = size.x;
        const height = size.y;

        /**
         * Weights of materials identified by material texture. Larger weight causes material to appear more prominently
         * @type {DataTexture2DArray}
         */
        this.weightTexture = new DataTexture2DArray(new Uint8Array(width * height), width, height, 1);
        this.weightTexture.generateMipmaps = false;
        this.weightTexture.format = RedFormat;
        this.weightTexture.type = UnsignedByteType;
        this.weightTexture.magFilter = LinearFilter;
        this.weightTexture.minFilter = NearestFilter;

        /**
         * @deprecated No longer used due to poor blending results
         * stores indices of materials participating in the splat mix
         * @type {DataTexture}
         */
        this.materialTexture = new DataTexture(new Uint8Array(width * height * 4), width, height);
    }

    /**
     *
     * @param {Uint8Array} source
     * @param {number} destinationX
     * @param {number} destinationY
     * @param {number} sourceWidth
     * @param {number} sourceHeight
     */
    writeWeightData(source, destinationX, destinationY, sourceWidth, sourceHeight) {
        const depth = this.depth;

        const sourceLayerSize = sourceWidth * sourceHeight;

        assert.equal(source.length, sourceLayerSize * depth, 'source size is incorrect');

        const w = this.size.x;
        const h = this.size.y;

        const destinationLayerSize = w * h;

        const _w = max2(0, min2(w - destinationX, sourceWidth));
        const _h = max2(0, min2(h - destinationY, sourceHeight));

        const dData = this.weightData;

        for (let i = 0; i < depth; i++) {

            const dLayerAddress = destinationLayerSize * i;
            const sLayerAddress = sourceLayerSize * i;

            for (let y = 0; y < _h; y++) {
                const dY = y + destinationY;

                const dRowAddress = dY * w + dLayerAddress;

                const sRowAddress = y * sourceWidth + sLayerAddress;

                for (let x = 0; x < _w; x++) {
                    const dX = x + destinationX;

                    const dAddress = dRowAddress + dX;

                    const sAddress = sRowAddress + x;

                    dData[dAddress] = source[sAddress];
                }
            }

        }
    }

    /**
     *
     * @param {Uint8Array} destination
     * @param {number} sourceX
     * @param {number} sourceY
     * @param {number} width
     * @param {number} height
     */
    readWeightData(destination, sourceX, sourceY, width, height) {
        const depth = this.depth;

        const w = this.size.x;
        const h = this.size.y;

        const sourceLayerSize = w * h;
        const destinationLayerSize = width * height;

        assert.equal(destination.length, destinationLayerSize * depth, 'destination size is incorrect');


        const _w = max2(0, min2(w - sourceX, width));
        const _h = max2(0, min2(h - sourceY, height));

        const sData = this.weightData;

        for (let i = 0; i < depth; i++) {

            const dLayerAddress = destinationLayerSize * i;
            const sLayerAddress = sourceLayerSize * i;

            for (let y = 0; y < _h; y++) {
                const dRowAddress = y * width + dLayerAddress;

                const sRowAddress = (y + sourceY) * w + sLayerAddress;

                for (let x = 0; x < _w; x++) {
                    const dAddress = dRowAddress + x;

                    const sAddress = sRowAddress + x + sourceX;

                    destination[dAddress] = sData[sAddress];
                }
            }

        }
    }

    /**
     *
     * @param {number} u
     * @param {number} v
     * @param {number} materialIndex
     * @returns {number}
     */
    sampleWeight(u, v, materialIndex) {

        const width = this.size.x;
        const height = this.size.y;

        const layerSize = width * height;

        const startAddress = layerSize * materialIndex;
        const endAddress = startAddress + layerSize;

        //build a sampler for the layer
        const sampler = new Sampler2D(this.weightData.subarray(startAddress, endAddress), 1, width, height);

        const result = sampler.sampleChannelBilinear(u * width, v * height, 0);

        return result;
    }

    /**
     * @returns {Uint8ClampedArray|Uint8Array}
     */
    get weightData() {
        return this.weightTexture.image.data;
    }

    /**
     * @returns {Uint8ClampedArray|Uint8Array}
     */
    get materialData() {
        return this.materialTexture.image.data;
    }

    /**
     *
     * @return {Sampler2D}
     */
    get materialSampler() {
        return new Sampler2D(this.materialData, 4, this.size.x, this.size.y);
    }

    /**
     *
     * @return {Task[]}
     */
    optimize() {
        const optimizer = new SplatMapOptimizer();


        return [];
    }

    /**
     * Computes a making map, where each texel of each layer is given a rank based on it's weight relative to other layers
     * @param {Uint8Array} result
     * @returns {Task}
     */
    computeWeightRankingMap(result) {
        const w = this.size.x;
        const h = this.size.y;
        const depth = this.depth;

        const weightData = this.weightData;

        const sample_weights = [];
        const sample_materials = [];

        function compareSampleWeights(m0, m1) {
            const w0 = sample_weights[m0];
            const w1 = sample_weights[m1];

            return w1 - w0;
        }

        const layerSize = w * h;


        return countTask(0, w * h, index => {

            //read sample for all layers
            for (let d = 0; d < depth; d++) {

                const layerOffset = d * layerSize;

                const address = index + layerOffset;

                sample_materials[d] = d;
                sample_weights[d] = weightData[address];
            }

            //sort the layers
            sample_materials.sort(compareSampleWeights);

            //write ranking
            for (let rank = 0; rank < depth; rank++) {
                const material = sample_materials[rank];

                const layerOffset = material * layerSize;

                const address = index + layerOffset;

                result[address] = rank;
            }

        });

    }

    /**
     * Cut a specified layer, depth will be reduced by 1
     * @param {number} index
     * @returns {boolean}
     */
    removeWeightLayer(index) {

        if (index >= this.depth) {
            //layer doesn't exist
            return false;
        }

        this.depth--;

        const layerByteSize = this.size.x * this.size.y;

        const startAddress = index * layerByteSize;
        const endAddress = (index + 1) * layerByteSize;

        const image = this.weightTexture.image;

        const oldData = image.data;

        oldData.copyWithin(startAddress, endAddress);

        const newData = new Uint8Array(this.depth * layerByteSize);


        newData.set(oldData.subarray(0, newData.length));

        image.data = newData;

        image.depth = this.depth;

        this.weightTexture.needsUpdate = true;

        return true;
    }

    /**
     *
     * @param {number} layerIndex
     * @param {number} value
     */
    fillLayerWeights(layerIndex, value) {
        const w = this.size.x;
        const h = this.size.y;

        const layerSize = w * h;

        const startAddress = layerSize * layerIndex;
        const endAddress = startAddress + layerSize;

        const weightData = this.weightData;

        for (let i = startAddress; i < endAddress; i++) {
            weightData[i] = value;
        }
    }

    addWeightLayer() {

        const layerByteSize = this.size.x * this.size.y;

        this.depth++;

        const depth = this.depth;

        const data = new Uint8Array(layerByteSize * depth);

        data.set(this.weightData);

        this.weightTexture.image.data = data;
        this.weightTexture.image.depth = depth;
        this.weightTexture.needsUpdate = true;
    }

    /**
     *
     * @param {number} width
     * @param {number} height
     * @param {number} depth
     */
    resize(width, height, depth) {
        const oldWidth = this.size.x;
        const oldHeight = this.size.y;
        const oldDepth = this.depth;

        this.depth = depth;

        if (width !== oldWidth || height !== oldHeight) {

            this.size.set(width, height);

            const materialImage = this.materialTexture.image;

            const oldMaterialData = materialImage.data;

            materialImage.width = width;
            materialImage.height = height;
            materialImage.data = new Uint8Array(width * height * 4);

            const source = new Sampler2D(oldMaterialData, 4, oldWidth, oldHeight);
            const target = new Sampler2D(materialImage.data, 4, width, height);

            scaleSampler2D(source, target);

            this.materialTexture.needsUpdate = true;
        }

        if (width !== oldWidth || height !== oldHeight || depth !== oldDepth) {

            const weightImage = this.weightTexture.image;

            const oldWeightData = weightImage.data;

            const oldLayerSize = oldWidth * oldHeight;
            const newLayerSize = width * height;

            weightImage.width = width;
            weightImage.height = height;
            weightImage.depth = depth;
            weightImage.data = new Uint8Array(newLayerSize * depth);

            for (let d = 0; d < min2(depth, oldDepth); d++) {

                const source = new Sampler2D(oldWeightData.subarray(d * oldLayerSize, (d + 1) * oldLayerSize), 1, oldWidth, oldHeight);
                const target = new Sampler2D(weightImage.data.subarray(d * newLayerSize, (d + 1) * newLayerSize), 1, width, height);

                scaleSampler2D(source, target);
            }

            this.weightTexture.needsUpdate = true;
        }

    }
}
