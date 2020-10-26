import { AssetLoader } from "../../engine/asset/loaders/AssetLoader.js";
import { load } from "opentype.js";
import { FontAsset } from "./FontAsset.js";


export class FontAssetLoader extends AssetLoader {
    load(path, success, failure, progress) {
        load(path, function (err, font) {
            if (err) {
                failure(err);
            } else {

                const asset = new FontAsset(font);

                success(asset);

            }
        });
    }
}
