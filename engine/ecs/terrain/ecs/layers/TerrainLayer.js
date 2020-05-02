import Vector2 from "../../../../../core/geom/Vector2.js";
import { GameAssetType } from "../../../../asset/GameAssetType.js";
import { Sampler2D } from "../../../../graphics/texture/sampler/Sampler2D.js";

export class TerrainLayer {
    constructor() {
        /**
         *
         * @type {String}
         */
        this.textureDiffuseURL = null;

        /**
         *
         * @type {Sampler2D}
         */
        this.diffuse = Sampler2D.uint8(3, 1, 1);

        /**
         *
         * @type {Vector2}
         */
        this.size = new Vector2(1, 1);
    }

    /**
     *
     * @param {string} url
     * @param {number} width
     * @param {number} height
     */
    static from(url, width, height) {
        const r = new TerrainLayer();

        r.textureDiffuseURL = url;
        r.size.set(width, height);

        return r;
    }

    /**
     *
     * @param {AssetManager} assetManager
     * @returns {Promise}
     */
    loadTextureData(assetManager) {

        const assetPromise = assetManager.promise(this.textureDiffuseURL, GameAssetType.Image);

        return assetPromise
            .then(assert => {
                const image = assert.create();

                const s = image.width * image.height;

                const data = image.data;

                if (this.diffuse === null || this.diffuse.width !== image.width || this.diffuse.height !== image.height) {
                    // loaded image does not match the side of the layer
                    this.diffuse = Sampler2D.uint8(3, image.width, image.height);
                }

                const layerData = this.diffuse.data;

                // copy RGBA image data into the layer's RGB data

                for (let i = 0; i < s; i++) {
                    const a4 = i * 4;
                    const a3 = i * 3;

                    layerData[a3] = data[a4];
                    layerData[a3 + 1] = data[a4 + 1];
                    layerData[a3 + 2] = data[a4 + 2];
                }
            });
    }
}
