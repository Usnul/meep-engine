import { compareNumbersAscending } from "../../function/Functions.js";

/**
 *
 * @param {number[]} values
 * @param {number} start
 * @param {number} end
 * @returns {number}
 */
export function computeStatisticalPartialMedian(values, start, end) {
    const copy = values.slice();

    copy.sort(compareNumbersAscending);

    const range = end - start;

    const position = (start + range / 2) | 0;

    return copy[position];
}
