import { GameAssetType } from "./GameAssetType.js";

/**
 *
 * @param {string} url
 * @param {AssetManager} am
 * @return {Promise}
 */
export function loadAssetAliasList(url, am) {

    return am.promise(url, GameAssetType.JSON)
        .then(asset => {

            const j = asset.create();

            for (const alias in j) {
                const { path, type } = j[alias];

                am.assignAlias(alias, path, type);

            }

        });

}
