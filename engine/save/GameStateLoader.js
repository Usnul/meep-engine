/**
 * Created by Alex on 26/02/2017.
 */

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

    load(name, resolve, reject, progress) {
        const engine = this.engine;


        const gameSaves = engine.gameSaves;

        gameSaves.update()
            .then(() => {
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

                matches.sort((a, b) => b.timestamp - a.timestamp);

                const mostRecent = matches[0];

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
