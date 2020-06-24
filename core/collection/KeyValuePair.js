/**
 * @template Key, Value
 */
export class KeyValuePair {
    /**
     * @template Key, Value
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

    /**
     *
     * @param {KeyValuePair} other
     * @return {boolean}
     */
    equals(other){
        return this.key === other.key
            && this.value === other.value;
    }
}
