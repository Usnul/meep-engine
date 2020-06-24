export class EnginePlatform {
    constructor() {
    }


    /**
     * @returns {Storage}
     */
    getStorage() {
        throw new Error('Not implemented');
    }

    /**
     * @returns {AchievementGateway}
     */
    getAchievementGateway() {
        throw new Error('Not implemented');
    }

    /**
     * @param {string[]} options
     * @returns {string}
     */
    pickDefaultLocale(options) {
        throw new Error('Not implemented');
    }

    /**
     * @returns {Promise}
     */
    startup() {
        return Promise.resolve();
    }

    /**
     * @returns {Promise}
     */
    shutdown() {
        return Promise.resolve();
    }

}
