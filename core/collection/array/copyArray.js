/**
 * @template T
 * @param {T[]} source
 * @param {T[]} target
 */
export function copyArray(source, target) {

    const n = source.length;
    for (let i = 0; i < n; i++) {
        const v = source[i];

        target[i] = v;
    }


    const tL = target.length;

    if (n > tL) {
        target.splice(n, tL - n);
    }
}
