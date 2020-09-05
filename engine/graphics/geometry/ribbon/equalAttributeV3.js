import { equalAttributeValue } from "./equalAttributeValue.js";

/**
 *
 * @param {BufferAttribute} first
 * @param {int} firstIndex
 * @param {BufferAttribute} second
 * @param {int} secondIndex
 * @returns {boolean}
 */
export function equalAttributeV3(first, firstIndex, second, secondIndex) {
    return equalAttributeValue(first, firstIndex * 3, second, secondIndex * 3, 3);
}
