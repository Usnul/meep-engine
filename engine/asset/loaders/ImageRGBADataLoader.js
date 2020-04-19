import { AssetLoader } from "./AssetLoader.js";
import { Asset } from "../Asset.js";
import { ImageLoader as ThreeImageLoader } from "three/src/loaders/ImageLoader.js";
import { computeFileExtension } from "../../../core/FilePath.js";
import { GameAssetType } from "../GameAssetType.js";
import { convertTexture2Sampler2D } from "../../graphics/texture/sampler/convertTexture2Sampler2D.js";

class ImageRGBADataAsset extends Asset {
    constructor(data, width, height) {
        super();

        this.data = data;
        this.width = width;
        this.height = height;

        this.byteSize = data.length;
    }

    create() {
        return {
            data: this.data,
            width: this.width,
            height: this.height
        };
    }
}

function loadStandard(path, success, failure, progress) {
    const imageLoader = new ThreeImageLoader();

    /**
     *
     * @param {Image} img
     */
    function handleImageLoad(img) {


        /**
         *
         * @param {ImageBitmap} data
         */
        function handleImageBitmap(data) {

            decode(data);

            const width = data.width;
            const height = data.height;

            data.close();

            success(new ImageRGBADataAsset(decodedData, width, height));

        }

        function buildAssetFromImage(img) {


            const imgWidth = img.width;
            const imgHeight = img.height;

            decode(img);


            success(new ImageRGBADataAsset(decodedData, imgWidth, imgHeight));

        }

        let decodedData = null;

        if (typeof window.createImageBitmap === "function") {
            createImageBitmap(img)
                .then(handleImageBitmap, failure);
        } else {
            buildAssetFromImage(img);
        }


        /**
         *
         * @param {Image|ImageBitmap} img
         */
        function decode(img) {
            const imgWidth = img.width;
            const imgHeight = img.height;

            //
            const canvas = document.createElement('canvas');
            canvas.width = imgWidth;
            canvas.height = imgHeight;
            const context = canvas.getContext('2d');

            context.drawImage(img, 0, 0, imgWidth, imgHeight);

            const imgd = context.getImageData(0, 0, imgWidth, imgHeight);
            decodedData = imgd.data;
        }


    }

    function handleProgress() {

    }

    imageLoader.load(path, handleImageLoad, handleProgress, failure);
}

export class ImageRGBADataLoader extends AssetLoader {
    load(path, success, failure, progress) {
        const extension = computeFileExtension(path);

        if (extension === 'dds') {
            //compressed texture
            this.assetManager.get(path, GameAssetType.Texture, asset => {

                /**
                 *
                 * @type {Texture}
                 */
                const texture = asset.create();

                const sampler2D = convertTexture2Sampler2D(texture);

                texture.dispose();

                const f = new ImageRGBADataAsset(sampler2D.data, sampler2D.width, sampler2D.height);

                success(f);

            }, failure, progress);

        } else {
            loadStandard(path, success, failure, progress);
        }
    }
}
