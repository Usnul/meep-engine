import { Asset } from "../../engine/asset/Asset.js";

export class FontAsset extends Asset {
    /**
     *
     * @param {Font} font
     */
    constructor(font) {
        super();

        this.__data = font;
    }

    /**
     *
     * @return {Font}
     */
    create() {
        return this.__data;
    }
}
