/**
 *
 * @param {BufferAttribute} source
 * @param {int} sourceIndex
 * @param {BufferAttribute} target
 * @param {int} targetIndex
 * @param {int} count
 */
export function copyAttributeValue(source, sourceIndex, target, targetIndex, count) {
    const targetArray = target.array;

    const sourceArray = source.array;

    for (let i = 0; i < count; i++) {
        targetArray[targetIndex + i] = sourceArray[sourceIndex + i];
    }
}
