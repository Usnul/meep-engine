export class AssetLoader {
    constructor() {
        /**
         *
         * @type {AssetManager}
         */
        this.assetManager = null;
    }

    /**
     *
     * @param {AssetManager} assetManager
     */
    link(assetManager) {
        this.assetManager = assetManager;
    }

    /**
     *
     * @param {string} path
     * @param {function(Asset)} success
     * @param {function} failure
     * @param {function(current:number, total:number)} progress
     */
    load(path, success, failure, progress) {

    }
}
