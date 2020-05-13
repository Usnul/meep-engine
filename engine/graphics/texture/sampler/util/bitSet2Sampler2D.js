import { assert } from "../../../../../core/assert.js";

/**
 * Convert a BitSet to 2D grid, useful for visualization purposes
 * @param {BitSet} source
 * @param {Sampler2D} target
 * @param {number[]} vTrue Value to write when bit is set
 * @param {number[]} vFalse value to write when bit is not set
 */
export function bitSet2Sampler2D(source, target, vTrue, vFalse) {
    assert.defined(source, 'source');
    assert.defined(target, 'target');

    assert.defined(vTrue, 'vTrue');
    assert.defined(vFalse, 'vFalse');

    assert.isArray(vTrue, 'vTrue');
    assert.isArray(vFalse, 'vFalse');

    assert.greaterThanOrEqual(vTrue.length, target.itemSize);
    assert.greaterThanOrEqual(vFalse.length, target.itemSize);

    const height = target.height;
    const width = target.width;

    for (let y = 0; y < height; y++) {
        const rowIndex = y * width;

        for (let x = 0; x < width; x++) {
            const cellIndex = rowIndex + x;

            const flag = source.get(cellIndex);

            if (flag) {
                target.set(x, y, vTrue);
            } else {
                target.set(x, y, vFalse);
            }
        }
    }
}
