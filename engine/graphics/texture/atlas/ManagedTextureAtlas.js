import { TextureAtlas } from "./TextureAtlas.js";
import { ReferenceManager } from "../../../ReferenceManager.js";
import { Sampler2D } from "../sampler/Sampler2D.js";
import { Cache } from "../../../../core/Cache.js";
import { GameAssetType } from "../../../asset/GameAssetType.js";
import { HashMap } from "../../../../core/collection/HashMap.js";
import { computeStringHash } from "../../../../core/primitives/strings/StringUtils.js";
import { strictEquals } from "../../../../core/function/Functions.js";

const CACHE_SIZE = 4194304;

export class ManagedAtlas {
    /**
     *
     * @param {AssetManager} assetManager
     * @constructor
     */
    constructor(assetManager) {

        /**
         * pre-allocate space on the atlas to avoid some initial re-sizing
         * @type {TextureAtlas}
         */
        const atlas = new TextureAtlas(64);

        /**
         *
         * @type {TextureAtlas}
         */
        this.atlas = atlas;


        /**
         *
         * @type {Cache<String, AtlasPatch>}
         */
        const patchesInactive = new Cache({
            maxWeight: CACHE_SIZE,
            keyHashFunction: computeStringHash,
            keyEqualityFunction: strictEquals,
            valueWeigher(patch) {
                return patch.sampler.data.length;
            },
            removeListener(key, value) {
                // console.warn(`ManagedAtlas: Patch removed from cache. url: ${key}`);

                atlas.remove(value);
            }
        });

        /**
         *
         * @type {HashMap<String, AtlasPatch>}
         */
        const activePatches = new HashMap({
            keyHashFunction: computeStringHash,
            keyEqualityFunction: strictEquals
        });

        /**
         * @private
         * @type {HashMap<String, AtlasPatch>}
         */
        this.patchesActive = activePatches;

        /**
         * @private
         * @type {Cache<String, AtlasPatch>}
         */
        this.patchesInactive = patchesInactive;

        /**
         * Automatically update TextureAtlas
         * @type {boolean}
         */
        this.autoUpdate = true;


        this.rebuildDelay = 200; //in milliseconds

        let counterLoadingAssets = 0;
        let lastRebuildTime = 0;

        const self = this;

        function tryRebuild() {
            const timeNow = Date.now();
            const timeElapsed = timeNow - lastRebuildTime;

            if (counterLoadingAssets === 0 || timeElapsed > self.rebuildDelay) {
                atlas.update();

                lastRebuildTime = timeNow;
            }
        }

        /**
         *
         * @param {String} url
         * @returns {Promise<AtlasPatch>}
         */
        function creator(url) {
            return new Promise(function (resolve, reject) {

                let patch = activePatches.get(url);

                if (patch !== undefined) {
                    resolve(patch);
                    return;
                }

                patch = patchesInactive.get(url);

                if (patch !== null) {
                    //move to active
                    patchesInactive.silentRemove(url);

                    activePatches.set(url, patch);

                    resolve(patch);
                    return;
                }

                /**
                 *
                 * @param {Asset} asset
                 */
                function onLoad(asset) {

                    //since load happens asynchronously, we need to make sure that the patch is still required
                    const refCount = referenceManager.getCount(url);

                    if (refCount === 0) {
                        //no longer part of active reference set, ignore
                        //this happens when a patch is requested and removed before it is loaded
                        reject(`'${url}' is no longer part of active reference set`);
                        return;
                    }

                    const image = asset.create();

                    //assert.equal(atlas.patches.filter(p => p.sampler.data === image.data).length, 0, "Atlas already contains this asset data");

                    //build sampler
                    const sampler = new Sampler2D(image.data, 4, image.width, image.height);
                    const patch = atlas.add(sampler);

                    //record active patch
                    activePatches.set(url, patch);

                    counterLoadingAssets--;

                    if (self.autoUpdate) {
                        tryRebuild();
                    }

                    // console.warn(`ManagedAtlas: Loaded patch. size: ${image.data.length}, width: ${image.width}, height: ${image.height}, url: ${url}`, atlas);

                    resolve(patch);
                }

                function onFailure(error) {
                    counterLoadingAssets--;

                    reject(error);
                }


                counterLoadingAssets++;

                assetManager.get(url, GameAssetType.Image, onLoad, onFailure);

            });
        }

        /**
         *
         * @param {String} url
         * @param {Promise<AtlasPatch>} promise
         */
        function destroyer(url, promise) {
            promise.then(function (patch) {
                //it is possible that promise is resolved after patch has already been removed from the Atlas, so we first check

                if (activePatches.has(url)) {
                    //remove from active
                    activePatches.delete(url);

                    //put into inactive set
                    patchesInactive.put(url, patch);
                }
            });
        }

        /**
         *
         * @type {ReferenceManager.<String,Promise.<AtlasPatch>>}
         */
        const referenceManager = new ReferenceManager(creator, destroyer);

        /**
         *
         * @type {ReferenceManager<String, Promise<AtlasPatch>>}
         */
        this.references = referenceManager;
    }

    reset() {
        this.references.reset();
        this.atlas.reset();
        this.patchesInactive.drop();
        this.patchesActive.clear();
    }

    /**
     *
     * @param {string} key
     * @returns {Promise<AtlasPatch>}
     */
    acquire(key) {
        return this.references.acquire(key);
    }

    /**
     *
     * @param {string} key
     */
    release(key) {
        this.references.release(key);
    }
}
