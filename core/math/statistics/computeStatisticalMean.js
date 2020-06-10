import { assert } from "../../assert.js";

/**
 *
 * @param {number[]} values
 * @returns {number}
 */
export function computeStatisticalMean(values) {
    assert.isArray(values, 'value');

    let total = 0;

    const sampleSize = values.length;

    for (let i = 0; i < sampleSize; i++) {
        const value = values[i];

        total += value;
    }

    return total / sampleSize;
}
