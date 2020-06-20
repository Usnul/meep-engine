import xhr from "../../network/xhr.js";
import { AssetLoader } from "./AssetLoader.js";

export class JsonAssetLoader extends AssetLoader {
    load(path, callback, failure, progress) {
        xhr(path, function (data) {
            let object;
            try {
                object = JSON.parse(data);
            } catch (e) {
                console.error("Failed to parse JSON " + path, e);
                console.error(data);

                failure(e);
                return;
            }

            const asset = {
                create: function () {
                    return object;
                }
            };

            callback(asset);
        }, failure);
    }
}
