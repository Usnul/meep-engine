import { assert } from "../../../core/assert.js";

export class InputBinding {
    /**
     *
     * @param {string} path
     * @param {function} listener
     * @param {boolean} [exclusive=false]
     */
    constructor({ path, listener, exclusive = false }) {
        assert.typeOf(path, 'string', 'path');
        assert.typeOf(listener, 'function', 'listener');

        /**
         *
         * @type {string}
         */
        this.path = path;
        /**
         *
         * @type {Function}
         */
        this.listener = listener;
        /**
         * @deprecated don't use
         * @type {boolean}
         */
        this.exclusive = exclusive;
    }
}
