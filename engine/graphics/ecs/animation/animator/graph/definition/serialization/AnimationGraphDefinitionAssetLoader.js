import { AssetLoader } from "../../../../../../../asset/loaders/AssetLoader.js";
import { GameAssetType } from "../../../../../../../asset/GameAssetType.js";
import { Asset } from "../../../../../../../asset/Asset.js";
import { readAnimationGraphDefinitionFromJSON } from "./readAnimationGraphDefinitionFromJSON.js";

export class AnimationGraphDefinitionAssetLoader extends AssetLoader {
    load(path, success, failure, progress) {

        this.assetManager.get(
            path,
            GameAssetType.JSON,
            jsonAsset => {
                const json = jsonAsset.create();

                const asset = new Asset(
                    () => {
                        return readAnimationGraphDefinitionFromJSON(json);
                    },
                    1
                );

                success(asset);
            },
            failure,
             progress
        );

    }
}
