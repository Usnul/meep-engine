import { AssetLoader } from "./AssetLoader.js";
import { GameAssetType } from "../GameAssetType.js";
import { FunctionCompiler } from "../../../core/function/FunctionCompiler.js";
import { Asset } from "../Asset.js";

class JavascriptAsset extends Asset {
    constructor(code) {
        super();

        this.code = code;

        this.byteSize = 128;

    }

    create(args) {

        return FunctionCompiler.INSTANCE.compile({ code: this.code, args });
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
