import xhr from "../../network/xhr.js";
import { AssetLoader } from "./AssetLoader.js";

export class TextAssetLoader extends AssetLoader {
    load(path, callback, failure, progress) {
        xhr(path, function (data) {
            const asset = {
                create: function () {
                    return data;
                }
            };
            callback(asset);
        }, failure);
    }
}
