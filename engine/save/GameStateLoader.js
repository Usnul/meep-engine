/**
 * Created by Alex on 26/02/2017.
 */

import { arrayPickBestElement } from "../../core/collection/ArrayUtils.js";
import { GameSaveStateMetadata } from "../../../view/game/save/GameSaveStateMetadata.js";

class GameStateLoader {
    /**
     *
     * @param {Engine} engine
     */
    constructor(engine) {
        /**
         * @type {Engine}
         */
        this.engine = engine;
        /**
         *
         * @type {Storage}
         */
        this.storage = engine.storage;
    }

    save(name, resolve, reject, progress) {
        const engine = this.engine;

        const currentScene = engine.sceneManager.currentScene;

        const saveComplete = engine.gameSaves.store({ scene: currentScene, name });
        saveComplete.then(resolve, reject);

    }

    /**
     * @deprecated
     * @param {string} name
     * @param {function} resolve
     * @param {function} reject
     * @param {function} progress
     */
    legacyLoad(name, resolve, reject, progress) {
        console.warn('legacyLoad', name);

        this.storage.loadBinary(name, resolve, reject, progress);
    }

    /**
     * @deprecated
     * @param name
     * @param resolve
     * @param reject
     */
    legacyExists(name, resolve, reject) {
        console.warn('legacyExists', name);

        this.storage.contains(name, resolve, reject);
    }

    /**
     *
     * @param {string} name
     * @param {function(ArrayBuffer)} resolve
     * @param {function(reason:*)} reject
     * @param {function(number)} [progress]
     */
    load(name, resolve, reject, progress) {
        const engine = this.engine;


        const gameSaves = engine.gameSaves;

        gameSaves.update()
            .then(() => {
                /**
                 *
                 * @type {Array<GameSaveStateMetadata>}
                 */
                const matches = gameSaves.data.filter(m => {

                    if (m.locked) {
                        return false;
                    }

                    if (m.name === name) {
                        return true;
                    } else {
                        return false;
                    }
                });

                //find most recent
                const mostRecent = arrayPickBestElement(matches, m => m.timestamp);


                if (mostRecent === undefined) {
                    //try legacy
                    return new Promise((lResolve, lReject) => this.legacyLoad(name, lResolve, lReject, progress));

                } else {

                    return gameSaves.loadData(mostRecent.id);
                }

            }).then(resolve, reject);
    }

    exists(name, resolve, reject) {
        const engine = this.engine;


        const gameSaves = engine.gameSaves;

        gameSaves.update()
            .then(() => {
                const exists = gameSaves.data.some(m => !m.locked && (m.name === name));

                if (!exists) {
                    //try legacy
                    this.legacyExists(name, resolve, reject);
                } else {
                    resolve(exists);
                }

            }).catch(reject);
    }
}

export default GameStateLoader;
