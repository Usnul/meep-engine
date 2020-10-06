import ObservedString from "./model/ObservedString.js";
import levenshtein from "fast-levenshtein";
import { parseTooltipString } from "../view/tooltip/gml/parser/parseTooltipString.js";
import { assert } from "./assert.js";
import { GameAssetType } from "../engine/asset/GameAssetType.js";

const VARIABLE_REGEX = /\$\{([a-zA-Z0-9_]+)\}/gi;

/**
 *
 * @param {string} template
 * @param {object} seed
 * @returns {string}
 */
function seedTemplate(template, seed) {

    const result = template.replace(VARIABLE_REGEX, function (match, varName) {
        const value = seed[varName];

        if (value === undefined) {
            console.error(`No value provided for variable '${varName}' in template '${template}', seed:`, seed);
        }

        return value;
    });

    return result;
}

/**
 * Validation utility method
 * @param {string} template
 * @return {string}
 */
function validationMockSeed(template) {

    const result = template.replace(VARIABLE_REGEX, function (match, varName) {
        return "0";
    });

    return result;
}

const FAILURE_MESSAGE_CACHE = {};

export class Localization {
    constructor() {
        /**
         *
         * @type {AssetManager|null}
         */
        this.assetManager = null;

        this.json = {};

        /**
         * Measured in characters per second
         * @type {number}
         */
        this.reading_speed = 10;

        /**
         *
         * @type {ObservedString}
         */
        this.locale = new ObservedString('');
    }

    /**
     *
     * @param {string} text
     * @returns {number}
     */
    computeReadingTime(text) {
        assert.typeOf(text, 'string', 'text');

        return text.length / this.reading_speed;
    }

    /**
     *
     * @param {AssetManager} am
     */
    setAssetManager(am) {
        this.assetManager = am;
    }

    /**
     * @returns {boolean}
     * @param {function(key:string, error:*, original: string)} errorConsumer
     */
    validate(errorConsumer) {
        let result = true;

        for (let key in this.json) {
            const value = this.json[key];

            const seededValue = validationMockSeed(value);

            try {
                parseTooltipString(seededValue);
            } catch (e) {
                result = false;
                errorConsumer(key, e, value);
            }
        }

        return result;
    }

    /**
     *
     * @param {string} locale
     * @returns {Promise}
     */
    loadLocale(locale) {
        const am = this.assetManager;

        const pLoadData = am.promise(`data/database/text/${locale}.json`, GameAssetType.JSON)
            .then(asset => {
                const json = asset.create();

                this.json = json;

                this.locale.set(locale);
            });

        const pLoadMetadata = am.promise(`data/database/text/languages.json`, GameAssetType.JSON)
            .then(asset => {
                const languages_metadata = asset.create();

                const { reading_speed = 10 } = languages_metadata[locale];

                assert.isNumber(reading_speed, 'reading_speed');
                assert.greaterThan(reading_speed, 0, 'reading_speed');

                this.reading_speed = reading_speed;
            });

        return Promise.all([pLoadData, pLoadMetadata]);
    }

    /**
     *
     * @param {String} id
     * @return {boolean}
     */
    hasString(id) {
        return this.json[id] !== undefined;
    }

    /**
     *
     * @param {number} value
     */
    formatIntegerByThousands(value) {
        const formatter = new Intl.NumberFormat(this.locale.getValue(), { useGrouping: true });

        return formatter.format(value);
    }

    /**
     *
     * @param {string} id
     * @param {object} [seed]
     *
     * @returns {string}
     */
    getString(id, seed = {}) {
        assert.typeOf(id, 'string', 'id');

        const value = this.json[id];

        if (value === undefined) {

            if (!ENV_PRODUCTION) {
                const locale = this.locale.getValue();

                if (FAILURE_MESSAGE_CACHE[locale] === undefined) {
                    FAILURE_MESSAGE_CACHE[locale] = {};
                }

                if (FAILURE_MESSAGE_CACHE[locale][id] === undefined) {

                    //try to find similar keys
                    const similarities = Object.keys(this.json).map(function (key) {
                        const distance = levenshtein.get(key, id);
                        return {
                            key,
                            distance
                        };
                    });

                    similarities.sort(function (a, b) {
                        return a.distance - b.distance;
                    });

                    const suggestions = similarities.slice(0, 3).map(p => p.key);

                    const message = `No localization value for id='${id}', seed=${JSON.stringify(seed)}, approximate matches: ${suggestions.join(', ')}`;

                    FAILURE_MESSAGE_CACHE[locale][id] = message;

                }

                console.warn(FAILURE_MESSAGE_CACHE[locale][id]);

            }

            //no value
            return `@${id}`;

        }

        //value needs to be seeded
        const seededValue = seedTemplate(value, seed);

        return seededValue;
    }
}
