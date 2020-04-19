import { assert } from "../../core/assert.js";
import { noop, returnTrue } from "../../core/function/Functions.js";

/**
 * @template T
 */
export class StorageBackedSet {
    /**
     * @template T
     */
    constructor() {
        /**
         *
         * @type {string}
         */
        this.key = "";
        /**
         *
         * @type {Storage}
         */
        this.storage = null;

        /**
         * @private
         * @type {Promise}
         */
        this.lastPromise = Promise.resolve();
    }

    /**
     *
     * @param {string} key
     * @param {Storage} storage
     */
    initialize({ key, storage }) {
        assert.defined(storage, 'storage');
        assert.typeOf(key, 'string', 'key');

        this.key = key;
        this.storage = storage;
    }

    /**
     *
     * @return {Promise<T[]>}
     */
    read() {

        const execute = () => {
            return new Promise((resolve, reject) => {
                this.storage.contains(this.key, (exists) => {

                    if (!exists) {
                        //empty list
                        resolve([]);
                        return;
                    }

                    this.storage.load(this.key, (data) => {

                        if (data === undefined || data === null) {
                            resolve([]);
                        } else {
                            resolve(data);
                        }

                    }, reject, noop);
                }, reject);

            });
        };

        const p = this.lastPromise.then(execute, execute);

        this.lastPromise = p;

        return p
    }

    /**
     *
     * @param {T} value
     * @return {Promise<T[]>}
     */
    add(value) {
        const p = this.read().then(list => {
            if (list.indexOf(value) === -1) {
                list.push(value);

                const store = new Promise((resolve, reject) => {
                    this.storage.store(this.key, list, resolve, reject, noop);
                });

                return store.then(() => list);
            } else {
                return list;
            }
        });

        this.lastPromise = p;

        return p;
    }

    /**
     *
     * @param {T} value
     * @return {Promise<boolean>}
     */
    contains(value) {
        const p = this.read().then(list => {
            return list.indexOf(value) !== -1;
        });

        this.lastPromise = p;

        return p;
    }


    /**
     * @param {T} value
     * @returns {Promise<boolean>}
     */
    remove(value) {
        const p = this.read().then(list => {
            const i = list.indexOf(value);
            if (i === -1) {
                return false;
            }

            list.splice(i, 1);

            const store = new Promise((resolve, reject) => {
                this.storage.store(this.key, list, resolve, reject);
            });

            return store.then(returnTrue);
        });

        this.lastPromise = p;

        return p;
    }
}
