import { assert } from "./assert.js";
import { noop } from "./function/Functions.js";

/**
 * @template T
 * @param {function():T} creator
 * @param {function(T)} destroyer
 * @param {function(T)} resetter
 * @constructor
 */
function ObjectPoolFactory(creator, destroyer, resetter) {
    /**
     * @private
     * @type {function(): T}
     */
    this.creator = creator;
    /**
     * @private
     * @type {function(T)}
     */
    this.destroyer = destroyer;
    /**
     * @private
     * @type {function(T)}
     */
    this.resetter = resetter;

    /**
     * @private
     * @type {Array<T>}
     */
    this.pool = [];

    /**
     * @private
     * @type {number}
     */
    this.maxSize = 256;
}

/**
 *
 * @returns {T}
 */
ObjectPoolFactory.prototype.create = function () {
    if (this.pool.length > 0) {
        const oldInstance = this.pool.pop();

        //reset the object
        this.resetter(oldInstance);

        assert.notEqual(oldInstance, null, 'oldInstance is null');
        assert.notEqual(oldInstance, undefined, 'oldInstance is undefined');

        return oldInstance;
    } else {
        const newInstance = this.creator();


        assert.notEqual(newInstance, null, 'newInstance is null');
        assert.notEqual(newInstance, undefined, 'newInstance is undefined');

        return newInstance;
    }
};

/**
 *
 * @param {T} object
 * @returns {boolean}
 */
ObjectPoolFactory.prototype.release = function (object) {
    assert.notEqual(object, null, 'object is null');
    assert.notEqual(object, undefined, 'object is undefined');

    assert.arrayHasNo(this.pool, object, `Pool already contains object that is being attempted to be release`);

    if (this.pool.length >= this.maxSize) {
        //pool is too large, destroy the object
        if (this.destroyer !== noop) {
            this.destroyer(object);
        }

        return false;
    }

    //add it to the pool
    this.pool.push(object);

    return true;
};

export { ObjectPoolFactory };
