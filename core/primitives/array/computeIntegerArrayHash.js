/**
 *
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {number} length
 */
export function computeIntegerArrayHash(data, offset, length) {
    const end = offset + length;

    let hash = 0;

    for (let i = offset; i < end; i++) {
        const singleValue = data[i];
        hash = ((hash << 5) - hash) + singleValue;
        hash |= 0; // Convert to 32bit integer
    }

    return hash;
}
