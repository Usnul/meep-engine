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

    const x = inverseLerp(max, min, distance);

    //approximating logarithmic curve with 5th degree polynomial curve
    return Math.pow(x, 5);
}
