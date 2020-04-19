/**
 *
 * @param {boolean} a
 * @param {boolean} b
 * @return {number}
 */
export function compareBooleans(a, b) {
    if (a === b) {
        return 0;
    }

    if (a) {
        return 1
    } else {
        return -1;
    }
}
