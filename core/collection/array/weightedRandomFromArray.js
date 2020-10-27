import { assert } from "../../assert.js";
import { binarySearchLowIndex } from "../ArrayUtils.js";
import { compareNumbers } from "../../primitives/numbers/compareNumbers.js";


const weights = [];

/**
 * @template T
 * @param {T[]} array
 * @param {function} random
 * @param {function(T):number} weight
 * @param {*} [weightContext]
 * @param {number} [length]
 * @returns {T|undefined}
 */
export function weightedRandomFromArray(array, random, weight, weightContext, length = array.length) {
    assert.isArray(array, 'array');
    assert.typeOf(random, 'function', 'random');
    assert.typeOf(weight, 'function', 'weight');

    if (length === 0) {
        return undefined;
    }

    let weight_total = 0;

    for (let i = 0; i < length; i++) {
        const el = array[i];

        const w = weight.call(weightContext, el);

        if (w > 0) {
            // ignore negative weights, clamp them to 0

            weight_total += w;
        }

        weights[i] = weight_total;
    }

    const target_weight = random() * weight_total;

    const index = binarySearchLowIndex(weights, target_weight, compareNumbers, 0, length - 1);

    return array[index];
}
