import { inverseLerp } from "../../../../core/math/MathUtils.js";

/**
 *
 * @param {number} distance
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
export function attenuateSoundLogarithmic(distance, min, max) {
    if (distance >= max) {
        return 0;
    }

    if (distance <= min) {
        return 1;
    }

    const x = inverseLerp(min, max, distance);

    const x2 = x * x;
    const x3 = x2 * x;
    const x4 = x3 * x;
    const x5 = x4 * x;

    //approximating logarithmic curve with 5th degree polynomial curve, curve fitted from sound pressure table up to 10 meters
    return -11.699 * x5 + 35.57 * x4 - 41.628 * x3 + 23.617 * x2 - 6.8598 * x + 0.9974;
}
