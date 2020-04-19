import { assert } from "../assert.js";


/**
 *
 * @param {Array<function(*):Promise>} factories
 * @param {Promise} [head] chain head, promise to be resolved before rest of the links
 * @param {[]} [parameters] parameters are passed into each factory
 * @returns {Promise}
 */
export function buildPromiseChain(
    {
        factories,
        head = Promise.resolve(),
        parameters = []
    }
) {
    const numFactories = factories.length;

    let lastPromise = head;

    for (let i = 0; i < numFactories; i++) {
        const factory = factories[i];

        lastPromise = lastPromise.then((result) => {
            const args = parameters.concat([result]);

            const promise = factory.apply(null, args);

            assert.notEqual(promise, undefined, 'factory result is undefined');
            assert.notEqual(promise, null, 'factory result is null');

            assert.typeOf(promise, 'object', 'promise');
            assert.typeOf(promise.then, 'function', 'promise.then');

            return promise;
        });
    }

    return lastPromise;
}
