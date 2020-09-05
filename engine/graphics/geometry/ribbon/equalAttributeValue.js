/**
 *
 * @param {BufferAttribute} first
 * @param {int} firstIndex
 * @param {BufferAttribute} second
 * @param {int} secondIndex
 * @param {int} count
 * @returns {boolean}
 */
export function equalAttributeValue(first, firstIndex, second, secondIndex, count) {
    const firstArray = first.array;

    const secondArray = second.array;

    for (let i = 0; i < count; i++) {
        const vFirst = firstArray[firstIndex + i];
        const vSecond = secondArray[secondIndex + i];
        if (vFirst !== vSecond) {
            return false;
        }
    }

    return true;
}
