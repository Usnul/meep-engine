import { AssetLoader } from "../../../asset/loaders/AssetLoader.js";
import { GameAssetType } from "../../../asset/GameAssetType.js";
import { AttachmentSockets } from "../AttachmentSockets.js";
import { Asset } from "../../../asset/Asset.js";

export class AttachmentSocketsAssetLoader extends AssetLoader {
    load(path, success, failure, progress) {

        this.assetManager.promise(path, GameAssetType.JSON)
            .then(asset => {

                const json = asset.create();

                const a = new Asset(() => {
                    return AttachmentSockets.fromJSON(json);
                }, 1);

                success(a);
            }, failure);

    }
}
