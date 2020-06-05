import { AssetLoader } from "./AssetLoader.js";
import { Asset } from "../Asset.js";

export class SoundAssetManager extends AssetLoader {
    /**
     *
     * @param {AudioContext} context
     */
    constructor(context) {
        super();

        /**
         *
         * @type {AudioContext}
         */
        this.context = context;
    }

    load(path, success, failure, progress) {
        // Load a sound file using an ArrayBuffer XMLHttpRequest.
        const request = new XMLHttpRequest();

        request.open("GET", path, true);

        request.responseType = "arraybuffer";

        const context = this.context;

        request.onload = function (e) {
            //decode works asynchronously, this is important to prevent lag in main thread
            context.decodeAudioData(request.response, function (buffer) {
                const byteSize = e.total;

                const asset = new Asset(function () {
                    return buffer;
                }, byteSize);

                success(asset);
            });
        };

        request.onerror = failure;

        request.onprogress = function (e) {
            //report progress
            progress(e.loaded, e.total);
        };

        request.send();
    }
}
