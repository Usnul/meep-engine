import { copyAttributeValue } from "./copyAttributeValue.js";

/**
 *
 * @param {BufferAttribute} source
 * @param {int} sourceIndex
 * @param {BufferAttribute} target
 * @param {int} targetIndex
 */
export function copyAttributeV3(source, sourceIndex, target, targetIndex) {
    copyAttributeValue(source, sourceIndex * 3, target, targetIndex * 3, 3);
}
