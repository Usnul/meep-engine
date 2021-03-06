import { inverseLerp } from "../../../../core/math/MathUtils.js";

export function attenuateSoundLinear(distance, min, max) {
    if (distance <= min) {
        return 1;
    } else if (distance >= max) {
        return 0;
    } else {
        return inverseLerp(max, min, distance);
    }
}
