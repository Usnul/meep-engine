/**
 * @template V
 * @param {Object<V>} object
 * @param {V} value
 * @returns {string}
 */
import { assert } from "../assert.js";
import { compareStrings } from "../primitives/strings/compareStrings.js";
import { compareNumbers } from "../primitives/numbers/compareNumbers.js";
import { compareBooleans } from "../primitives/boolean/compareBooleans.js";
import { compareArrays } from "../primitives/array/compareArrays.js";
import { extractFunctionBody } from "../function/extractFunctionBody.js";

/**
 *
 * @param {*} a
 * @param {*} b
 * @returns {number}
 */
export function compareValues(a, b) {
    if (a === b) {
        return 0;
    }

    const aType = typeof a;
    const bType = typeof b;

    if (aType !== bType) {
        return compareStrings(aType, bType);
    }

    if (aType === "string") {
        return compareStrings(a, b);
    } else if (aType === "number") {
        return compareNumbers(a, b);
    } else if (aType === "boolean") {
        return compareBooleans(a, b);
    } else if (aType === "function") {
        return compareStrings(extractFunctionBody(a), extractFunctionBody(b));
    } else if (aType === "object") {
        if (a === null) {
            if (b !== null) {
                return -1;
            } else {
                return 0;
            }
        } else if (b === null) {
            return 1;
        }

        if (Array.isArray(a) && Array.isArray(b)) {
            return compareArrays(a, b, compareValues);
        }

        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);

        const dKeys = compareArrays(aKeys, bKeys, compareStrings);

        if (dKeys !== 0) {
            return dKeys;
        }

        for (let p in a) {
            const d = compareValues(a[p], b[p]);

            if (d !== 0) {
                return d;
            }
        }
    }

    return 0;
}

export function objectKeyByValue(object, value) {
    for (let i in object) {
        if (object[i] === value) {
            return i;
        }
    }

    return undefined;
}

/**
 * @template V
 * @param {Object<V>} object
 * @param {string} key
 * @returns {V}
 * @throws {Error} if such key does not exist
 */
export function validatedObjectValueByKey(object, key) {

    assert.typeOf(key, 'string', 'key');

    const value = object[key];

    if (value === undefined) {
        throw new Error(`Unknown key '${key}', valid keys: [${Object.keys(object).join(', ')}]`);
    }

    return value;
}

/**
 * @template T
 * @param {T} object
 * @return {number}
 */
export function invokeObjectHash(object) {
    return object.hash();
}

/**
 * @template T
 * @param {T} object
 * @return {T}
 */
export function invokeObjectClone(object) {
    return object.clone();
}


/**
 * @template A,B
 * @param {A} a
 * @param {B} b
 * @returns {boolean}
 */
export function objectDeepEquals(a, b) {
    const tA = typeof a;
    const tB = typeof b;

    if (tA !== tB) {
        return false;
    }

    if (tA === "object") {
        //one way
        for (let pA in a) {
            if (!objectDeepEquals(a[pA], b[pA])) {
                return false;
            }
        }

        //other way
        for (let pB in b) {
            if (!objectDeepEquals(a[pB], b[pB])) {
                return false;
            }
        }

        return true;

    } else {
        return a === b;
    }
}
