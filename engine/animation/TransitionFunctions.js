import { makeCubicCurve } from "../../core/math/MathUtils.js";

/**
 *
 * @enum {function(x:number):number}
 */
const TransitionFunctions = {
    Linear: linear,
    Sine: sine,
    EaseIn: easeInQuad,
    EaseOut: easeOutQuad,
    EaseInOut: easeInOutQuad,
    CubicEaseIn: makeCubicCurve(0, 1, 0.98, 1),
};


/**
 * @param {number} x
 * @returns {number}
 */
function linear(x) {
    return x;
}

/**
 * @param {number} x
 * @returns {number}
 */
function sine(x) {
    const pi_2 = Math.PI / 2;
    return Math.sin(x * pi_2);
}

/**
 *
 * @param {number} x
 * @returns {number}
 */
function easeInQuad(x) {
    return x * x;
}

/**
 *
 * @param {number} x
 * @returns {number}
 */
function easeOutQuad(x) {
    return -x * (x - 2);
}

/**
 *
 * @param {number} t
 * @returns {number}
 */
function easeInOutQuad(t) {
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export default TransitionFunctions;
