import { AssetLoader } from "./AssetLoader.js";
import { Asset } from "../Asset.js";
import { computeFileExtension } from "../../../core/FilePath.js";
import { GameAssetType } from "../GameAssetType.js";
import { convertTexture2Sampler2D } from "../../graphics/texture/sampler/convertTexture2Sampler2D.js";
import WorkerBuilder from "../../../core/process/worker/WorkerBuilder.js";
import { OnDemandWorkerManager } from "../../../core/process/worker/OnDemandWorkerManager.js";

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

/**
 *
 * @param {string} path
 * @param {function} success
 * @param {function} failure
 * @param {function} progress
 * @param {OnDemandWorkerManager} worker
 */
function loadStandard(path, success, failure, progress, worker) {

    return fetch(path)
        .then(response => response.blob())
        .then(blob => worker.request("decode", [blob]))
        .then(
            handleImageBitmap,
            failure
        );

    /**
     *
     * @param {ImageBitmap} data
     */
    function handleImageBitmap(data) {

        const decodedData = decode(data);

        const width = data.width;
        const height = data.height;

        data.close();

        success(new ImageRGBADataAsset(decodedData, width, height));

    }


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

    return imgd.data;
}

export class ImageRGBADataLoader extends AssetLoader {
    constructor() {
        super();

        const workerBuilder = new WorkerBuilder();

        workerBuilder.addMethod('decode', function (blob) {
            return createImageBitmap(blob);
        });

        /**
         *
         * @type {OnDemandWorkerManager}
         */
        this.worker = new OnDemandWorkerManager(workerBuilder.build());
    }

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

            loadStandard(path, success, failure, progress, this.worker);
        }
    }
}
