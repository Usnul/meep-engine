import { compareNumbersAscending } from "../../function/Functions.js";

/**
 *
 * @param {number[]} values
 * @returns {number}
 */
export function computeStatisticalMedian(values) {
    const copy = values.slice();

    copy.sort(compareNumbersAscending);

    return copy[copy.length >> 1];
}
