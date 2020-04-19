/**
 * Created by Alex on 01/11/2014.
 * @copyright Alex Goldring 2014
 */


/**
 * Wraps a function in {@link window.requestAnimationFrame}
 * @param {function} original
 * @param {*} [thisArg]
 * @returns {function} proxy which will call the original at most once per frame
 */
export function frameThrottle(original, thisArg) {
    let pending = false;

    function wrap() {
        pending = false;
        original.call(thisArg);
    }

    function proxy() {
        if (!pending) {
            pending = true;
            requestAnimationFrame(wrap);
        }
    }

    return proxy;
}
