/**
 * @template T
 * @param {T[]} as
 * @param {T[]} bs
 * @param {function(T,T):number} comparator
 * @return {number}
 */
export function compareArrays(as, bs, comparator) {
    const n = as.length;
    const m = bs.length;

    if (n > m) {
        return 1;
    } else if (n < m) {
        return -1;
    }

    for (let i = 0; i < n; i++) {
        const a = as[i];
        const b = bs[i];

        const d = comparator(a, b);

        if (d !== 0) {
            return d;
        }
    }

    return 0;
}
