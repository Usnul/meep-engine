/**
 *
 * @param {Array} first
 * @param {Array} second
 * @returns {boolean}
 */
import { assert } from "../assert.js";
import { HashMap } from "./HashMap.js";
import { returnZero } from "../function/Functions.js";


/**
 * @template T
 * @param {T[]} array
 * @param {T} el
 * @param {function(T,T):number} compareFunction
 * @return {number} Index
 */
export function binarySearchLowIndex(array, el, compareFunction) {
    let minIndex = 0;
    let maxIndex = array.length - 1;
    let currentIndex;

    while (minIndex <= maxIndex) {

        currentIndex = (minIndex + maxIndex) >> 1;

        const cmp = compareFunction(el, array[currentIndex]);

        if (cmp > 0) {
            minIndex = currentIndex + 1;
        } else if (cmp < 0) {
            maxIndex = currentIndex - 1;
        } else {
            //set low boundary for next step based on assumption that upper bound is higher than lower bound
            break;
        }

    }

    return currentIndex;
}

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

    assert.typeOf(bestScore, 'number', 'bestScore');

    for (let i = 1; i < size; i++) {
        const el = array[i];

        // compute score
        const score = scoreFunction(el);

        assert.typeOf(score, 'number', 'score');

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
