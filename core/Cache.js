/**
 * @template Key,Value
 * @constructor
 */
import { noop, returnOne, returnZero, strictEquals } from "./function/Functions.js";
import { HashMap } from "./collection/HashMap.js";
import { collectIteratorValueToArray } from "./collection/IteratorUtils.js";
import { assert } from "./assert.js";

/**
 * @template Key, Value
 * @constructor
 */
function CacheElement() {
    /**
     *
     * @type {Key}
     */
    this.key = null;

    /**
     *
     * @type {Value}
     */
    this.value = null;

    /**
     *
     * @type {number}
     */
    this.lastAccess = 0;
}

/**
 *
 * @template Key, Value
 */
export class Cache {
    /**
     * @param {number} [maxWeight=Number.POSITIVE_INFINITY]
     * @param {function(key:Key):number} [keyWeigher= key=>0]
     * @param {function(value:Value):number} [valueWeigher= value=>1]
     * @param {function(key:Key, value:Value)} [removeListener] will be notified when element is either explicitly removed or evicted
     * @param {function(Key):number} [keyHashFunction]
     * @param {function(Key, Key):boolean} [keyEqualityFunction]
     * @constructor
     * @template Key, Value
     */
    constructor({
                    maxWeight = Number.POSITIVE_INFINITY,
                    keyWeigher = returnZero,
                    valueWeigher = returnOne,
                    removeListener = noop,
                    keyHashFunction = returnZero,
                    keyEqualityFunction = strictEquals
                } = {}) {

        assert.isNumber(maxWeight, 'maxWeight');
        assert.typeOf(keyWeigher, 'function', 'keyWeigher');
        assert.typeOf(valueWeigher, 'function', 'valueWeigher');
        assert.typeOf(removeListener, 'function', 'removeListener');
        assert.typeOf(keyHashFunction, 'function', 'keyHashFunction');
        assert.typeOf(keyEqualityFunction, 'function', 'keyEqualityFunction');

        /**
         *
         * @type {number}
         * @private
         */
        this.maxWeight = maxWeight;

        /**
         *
         * @type {number}
         * @private
         */
        this.weight = 0;

        /**
         *
         * @type {function(Key): number}
         * @private
         */
        this.keyWeigher = keyWeigher;

        /**
         *
         * @type {function(Value): number}
         * @private
         */
        this.valueWeigher = valueWeigher;

        /**
         *
         * @type {function(Key, Value)}
         * @private
         */
        this.removeListener = removeListener;


        /**
         *
         * @type {HashMap<Key, CacheElement<Key,Value>t>}
         * @private
         */
        this.data = new HashMap({
            keyHashFunction,
            keyEqualityFunction
        });
    }

    size() {
        return this.data.size;
    }

    /**
     *
     * @param {number} value
     */
    setMaxWeight(value) {
        if (typeof value !== "number" || value < 0) {
            throw new Error(`Weight must be a non-negative number, instead was '${value}'`);
        }

        this.maxWeight = value;

        this.evictUntilWeight(this.maxWeight);
    }

    recomputeWeight() {
        let result = 0;

        for (let [key, value] of this.data) {
            result += this.keyWeigher(key);
            result += this.valueWeigher(value);
        }

        this.weight = result;
    }

    /**
     *
     * @param {function(Value):number} weigher
     */
    setValueWeigher(weigher) {
        this.valueWeigher = weigher;
        //recompute weight
        this.recomputeWeight();
        this.evictUntilWeight(this.maxWeight);
    }

    /**
     *
     * @param {Key} key
     * @param {Value} value
     * @returns {number}
     */
    computeElementWeight(key, value) {
        return this.keyWeigher(key) + this.valueWeigher(value);
    }

    /**
     *
     * @returns {CacheElement<Key,Value>|null}
     */
    findEvictionVictim() {
        let oldestTime = Number.POSITIVE_INFINITY;
        let oldest = null;

        const cacheElements = this.data.values();

        for (let it = cacheElements.next(); !it.done; it = cacheElements.next()) {
            const element = it.value;
            if (element.lastAccess < oldestTime) {
                oldestTime = element.lastAccess;
                oldest = element;
            }
        }

        return oldest;
    }

    /**
     * Evicts a single element from the cache
     * @returns {boolean} true if element was evicted, false otherwise
     */
    evictOne() {
        //find a victim
        const victim = this.findEvictionVictim();

        if (victim !== null) {
            this.remove(victim.key);
            return true;
        } else {
            //nothing to remove
            return false;
        }
    }

    evictUntilWeight(targetWeight) {
        const target = Math.max(targetWeight, 0);

        while (this.weight > target) {
            this.evictOne();
        }
    }

    /**
     *
     * @param {Key} key
     * @param {Value} value
     */
    put(key, value) {
        let element = this.data.get(key);

        if (element === undefined) {
            element = new CacheElement();

            element.key = key;
            element.value = value;

            //compute weight
            const elementWeight = this.computeElementWeight(key, value);

            /**
             * It's possible that element being added is larger than cache's capacity,
             * in which case entire cache will be evicted, but there still won't be enough space
             * @type {number}
             */
            const weightTarget = this.maxWeight - elementWeight;

            //evict elements until there is enough space for the element
            this.evictUntilWeight(weightTarget);

            //store element
            this.data.set(key, element);

            //update weight
            this.weight += elementWeight;
        }

        //update access
        element.lastAccess = performance.now();
    }

    /**
     *
     * @param {Key} key
     * @returns {Value|null} value, or null if element was not found
     */
    get(key) {
        const element = this.data.get(key);

        if (element === undefined) {
            return null;
        } else {
            element.lastAccess = performance.now();

            return element.value;
        }
    }

    /**
     *
     * @param {Key} key
     * @returns {boolean}
     */
    contains(key) {
        return this.data.has(key);
    }

    /**
     * Remove without triggering {@link #removeListener}
     * @param {Key} key
     * @returns {boolean} true if element was removed, false otherwise
     */
    silentRemove(key) {
        const element = this.data.get(key);

        if (element === undefined) {
            //nothing to do
            return false;
        }

        const value = element.value;

        //compute weight
        const elementWeight = this.computeElementWeight(key, value);

        //remove from cache
        this.data.delete(key);

        //update weight
        this.weight -= elementWeight;

        return true;
    }

    /**
     *
     * @param {Key} key
     * @returns {boolean} true if element was removed, false otherwise
     */
    remove(key) {
        const element = this.data.get(key);

        if (element === undefined) {
            //nothing to do
            return false;
        }

        const value = element.value;

        //compute weight
        const elementWeight = this.computeElementWeight(key, value);

        //remove from cache
        this.data.delete(key);

        //update weight
        this.weight -= elementWeight;

        //notify
        this.removeListener(key, value);

        return true;
    }

    /**
     * Remove all elements from the cache
     */
    clear() {
        const keys = [];
        const key_iterator = this.data.keys();

        collectIteratorValueToArray(keys, key_iterator);

        const n = keys.length;
        for (let i = 0; i < n; i++) {
            const key = keys[i];
            this.remove(key);
        }
    }

    /**
     * Removed all data from cache
     * NOTE: Does NOT signal via {@link removeListener}
     */
    drop() {
        this.data.clear();
        this.weight = 0;
    }
}
