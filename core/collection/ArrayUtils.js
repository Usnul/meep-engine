/**
 *
 * @param {Array} first
 * @param {Array} second
 * @returns {boolean}
 */
import { assert } from "../assert.js";
import { HashMap } from "./HashMap.js";
import { returnZero } from "../function/Functions.js";
import { min2, randomIntegerBetween } from "../math/MathUtils.js";


/**
 * @template T
 * @param {function} random
 * @param {T[]} array
 */
export function randomizeArrayElementOrder(random, array) {
    const n = array.length;

    const lastValidIndex = n - 1;

    for (let i = 0; i < n; i++) {
        const t = randomIntegerBetween(random, 0, lastValidIndex);

        if (t === i) {
            continue;
        }

        arraySwapElements(array, i, t);
    }
}

/**
 * Pick multiple random items from an array
 *
 * @template T
 * @param {function} random
 * @param {T[]} source
 * @param {T[]} target
 * @param {number} count how many items to pick
 * @returns {T}
 */
export function randomMultipleFromArray(random, source, target, count) {

    const order = [];

    const source_length = source.length;
    for (let i = 0; i < source_length; i++) {
        order[i] = i;
    }

    randomizeArrayElementOrder(random, order);

    const target_length = min2(source_length, count);

    for (let i = 0; i < target_length; i++) {
        const index = order[i];
        const element = source[index];
        target.push(element);
    }

    return target_length;
}

/**
 * @template T
 * @param {T[]} array
 * @param {T} el
 * @param {function(T,T):number} compareFunction
 * @param {number} [minIndex]
 * @param {number} [maxIndex]
 * @return {number} Index
 */
export function binarySearchLowIndex(array, el, compareFunction, minIndex = 0, maxIndex = array.length - 1) {

    let result = 0;

    while (minIndex <= maxIndex) {

        const pivotIndex = (minIndex + maxIndex) >> 1;

        const cmp = compareFunction(el, array[pivotIndex]);

        if (cmp > 0) {
            minIndex = pivotIndex + 1;
        } else if (cmp < 0) {
            maxIndex = pivotIndex - 1;
            result = pivotIndex;
        } else {
            //set low boundary for next step based on assumption that upper bound is higher than lower bound
            result = pivotIndex;
            break;
        }

    }

    return result;
}

/**
 * @template T,R
 * @param {T[]} first
 * @param {R[]} second
 * @return {boolean}
 */
export function isArrayEqual(first, second) {

    const il = first.length;

    if (il !== second.length) return false;

    let i = 0;

    for (; i < il; i++) {

        const a = first[i];
        const b = second[i];

        if (a === b) {
            continue;
        }


        if (a === undefined) {
            //a is undefined, and B is something else
            return false;
        }

        if (a === null) {
            //a is null and B is something else
            return false;
        }

        //try "equals" method
        if (typeof a.equals === "function") {

            if (!a.equals(b)) {
                return false;
            }

        } else {
            return false;
        }

    }

    return true;

}

/**
 *
 * @param {Array} a
 * @param {Array} b
 * @returns {boolean}
 */
export function isArrayEqualStrict(a, b) {

    const il = a.length;

    if (il !== b.length) return false;

    let i = 0;

    for (; i < il; i++) {

        if (a[i] !== b[i]) return false;

    }

    return true;

}

/**
 * @template T
 * @param {T[]} array
 * @param {function(T):number} scoreFunction
 * @returns {T}
 */
export function arrayPickBestElement(array, scoreFunction) {
    assert.notEqual(array, undefined, 'array is undefined');
    assert.typeOf(scoreFunction, 'function', 'scoreFunction');

    let bestElement;
    let bestScore;

    const size = array.length;

    if (size === 0) {
        return undefined;
    }

    bestElement = array[0];

    bestScore = scoreFunction(bestElement);

    assert.isNumber(bestScore, 'bestScore');

    for (let i = 1; i < size; i++) {
        const el = array[i];

        // compute score
        const score = scoreFunction(el);

        assert.isNumber(score, 'score');

        if (score > bestScore) {
            bestScore = score;
            bestElement = el;
        }
    }

    return bestElement;
}

/**
 * @template T
 * @param {T[]} array
 * @param {function(T):number} scoreFunction
 * @returns {T[]}
 */
export function arrayPickBestElements(array, scoreFunction) {
    assert.notEqual(array, undefined, 'array is undefined');
    assert.isArray(array, 'array');

    assert.typeOf(scoreFunction, 'function', 'scoreFunction');

    let bestScore;

    const size = array.length;

    if (size === 0) {
        return [];
    }

    const first = array[0];

    bestScore = scoreFunction(first);

    assert.isNumber(bestScore, 'bestScore');

    const result = [first];

    for (let i = 1; i < size; i++) {
        const el = array[i];

        // compute score
        const score = scoreFunction(el);

        assert.isNumber(score, 'score');

        if (score > bestScore) {
            bestScore = score;

            result.splice(0, result.length);

            result.push(el);
        } else if (score === bestScore) {
            result.push(el);
        }
    }

    return result;
}

/**
 * @template T
 * @param {T[]} array
 * @param {function(T):number} scoreFunction
 * @returns {T}
 */
export function arrayPickMinElement(array, scoreFunction) {
    assert.notEqual(array, undefined, 'array is undefined');
    assert.typeOf(scoreFunction, 'function', 'scoreFunction');

    let bestElement;
    let bestScore;

    const size = array.length;

    if (size === 0) {
        return undefined;
    }

    bestElement = array[0];

    bestScore = scoreFunction(bestElement);

    assert.typeOf(bestScore, 'number', 'bestScore');

    for (let i = 1; i < size; i++) {
        const el = array[i];

        // compute score
        const score = scoreFunction(el);

        assert.typeOf(score, 'number', 'score');

        if (score < bestScore) {
            bestScore = score;
            bestElement = el;
        }
    }

    return bestElement;
}

/**
 * @template T,K
 * @param {T[]} array
 * @param {function(T):K} groupingFunction
 * @param keyHashFunction
 * @returns {Map<K,T[]>}
 */
export function groupArrayBy(array, groupingFunction, keyHashFunction = returnZero) {
    const result = new HashMap({
        keyHashFunction,
        keyEqualityFunction(a, b) {
            if (a === b) {
                return true;
            }

            if (typeof a === "object" && a !== null && typeof a.equals === "function") {
                return a.equals(b);
            }

            return false;
        }
    });

    for (let i = 0; i < array.length; i++) {
        const element = array[i];

        const groupKey = groupingFunction(element);

        const group = result.get(groupKey);

        if (group === undefined) {
            result.set(groupKey, [element]);
        } else {
            group.push(element);
        }
    }

    return result;
}


/**
 * @template T
 * @param {T[]} array
 * @param {number} index0
 * @param {number} index1
 */
export function arraySwapElements(array, index0, index1) {
    const t = array[index0];

    array[index0] = array[index1];
    array[index1] = t;
}
