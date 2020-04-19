/**
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function compareStrings(a, b) {
    const n = a.length;

    const m = b.length;

    if (n > m) {
        return 1;
    } else if (n < m) {
        return -1;
    }

    for (let i = 0; i < n; i++) {
        const c0 = a.charCodeAt(i);
        const c1 = b.charCodeAt(i);

        const d = c0 - c1;

        if (d !== 0) {
            return d;
        }
    }

    return 0;
}
