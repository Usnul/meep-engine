import { assert } from "../assert.js";

/**
 * @template R
 * @param {R[]} result
 * @param {Iterator<R>} iterator
 */
export function collectIteratorValueToArray(result, iterator) {
    assert.isArray(result, 'result');
    assert.defined(iterator, 'iterator');

    for (let it = iterator.next(); !it.done; it = iterator.next()) {
        result.push(it.value);
    }

}
