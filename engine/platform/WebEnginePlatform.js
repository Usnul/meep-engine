import { EnginePlatform } from "./EnginePlatform.js";
import { IndexedDBStorage } from "../save/storage/IndexedDBStorage.js";
import { StorageAchievementGateway } from "../achievements/gateway/StorageAchievementGateway.js";
import { arrayPickBestElement } from "../../core/collection/ArrayUtils.js";

export class WebEnginePlatform extends EnginePlatform {
    constructor() {
        super();

        /**
         *
         * @type {Storage}
         */
        this.storage = new IndexedDBStorage("com.lazykitty.komrade.game.state", this.services);
        this.storage.compressionEnabled = false;

        /**
         *
         * @type {StorageAchievementGateway}
         */
        this.achievements = new StorageAchievementGateway(this.storage);
    }

    getStorage() {
        return this.storage;
    }

    getAchievementGateway() {
        return this.achievements;
    }

    pickDefaultLocale(localeOptions) {
        function getURLHash() {
            const result = {};

            if (window === undefined) {
                return result;
            }

            const location = window.location;

            const hash = location.hash;

            const hashRegEx = /([a-zA-Z0-9\-\_]+)\=([a-zA-Z0-9\-\_]+)/g;

            let match;
            while ((match = hashRegEx.exec(hash)) !== null) {
                const variableName = match[1];
                const value = match[2];

                result[variableName] = value;
            }

            return result;
        }

        function pickLanguageByNavigator() {
            /**
             *
             * @type {ReadonlyArray<string>}
             */
            const languages = window.navigator.languages;


            function computeLanguageScore(code) {
                const numPreferences = languages.length;

                const index = languages.indexOf(code);
                if (index !== -1) {
                    return (numPreferences - index) * 1.1;
                } else {
                    const codePrefix = code.split('-')[0];

                    //only search by first portion
                    for (let i = 0; i < numPreferences; i++) {
                        const lang = languages[i];

                        const langPrefix = lang.split('-')[0];

                        if (codePrefix.toLowerCase() === langPrefix.toLowerCase()) {
                            //partial match, same language group
                            return (numPreferences - i) * 1;
                        }
                    }
                }

                return 0;
            }


            const scoredKeys = localeOptions.map(key => {
                return {
                    key,
                    score: computeLanguageScore(key)
                };
            });

            const best = arrayPickBestElement(scoredKeys, o => o.score);

            if (best.score === 0) {
                return 'en-gb';
            } else {
                return best.key;
            }
        }

        const urlHash = getURLHash();

        let locale;
        if (urlHash.lang !== undefined) {
            locale = urlHash.lang;
        } else {
            locale = pickLanguageByNavigator();
        }

        return locale;
    }
}
