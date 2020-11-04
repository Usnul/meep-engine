import { TerrainLayer } from "./TerrainLayer.js";
import { Sampler2D } from "../../../../graphics/texture/sampler/Sampler2D.js";
import { max2 } from "../../../../../core/math/MathUtils.js";

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
