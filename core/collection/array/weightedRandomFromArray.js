import { assert } from "../../assert.js";
import { binarySearchLowIndex } from "../ArrayUtils.js";
import { compareNumbers } from "../../primitives/numbers/compareNumbers.js";


const weights = [];

/**
 * @template T
 * @param {T[]} array
 * @param {function} random
 * @param {function(T):number} weight
 * @returns {T}
 */
export function weightedRandomFromArray(array, random, weight) {
    assert.isArray(array, 'array');
    assert.typeOf(random, 'function', 'random');
    assert.typeOf(weight, 'function', 'weight');

    const n = array.length;

    let weight_total = 0;

    for (let i = 0; i < n; i++) {
        const el = array[i];

        const w = weight(el);

        if (w > 0) {
            // ignore negative weights, clamp them to 0

            weight_total += w;
        }

        weights[i] = weight_total;
    }

    const target_weight = random() * weight_total;

    const index = binarySearchLowIndex(weights, target_weight, compareNumbers, 0, n - 1);

    return array[index];
}
