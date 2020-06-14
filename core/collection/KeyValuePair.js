/**
 * @template Key, Value
 */
export class KeyValuePair {
    /**
     *
     * @param {Key} key
     * @param {Value} value
     */
    constructor(key, value) {
        /**
         *
         * @type {Key}
         */
        this.key = key;
        /**
         *
         * @type {Value}
         */
        this.value = value;
    }
}
