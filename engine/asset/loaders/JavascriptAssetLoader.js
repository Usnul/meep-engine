import { AssetLoader } from "./AssetLoader.js";
import { GameAssetType } from "../GameAssetType.js";
import { FunctionCompiler } from "../../../core/function/FunctionCompiler.js";
import { Asset } from "../Asset.js";

class JavascriptAsset extends Asset {
    constructor(code) {
        super();

        this.byteSize = 0;
        this.program = FunctionCompiler.INSTANCE.compile({ code });
    }

    create() {
        return this.program;
    }
}

export class JavascriptAssetLoader extends AssetLoader {

    load(path, success, failure, progress) {
        this.assetManager.get(path, GameAssetType.Text, (textAsset) => {

            const text = textAsset.create();

            let asset;

            try {
                asset = new JavascriptAsset(text);
            } catch (e) {
                failure(e);
                return;
            }

            success(asset);

        }, failure, progress);
    }
}
