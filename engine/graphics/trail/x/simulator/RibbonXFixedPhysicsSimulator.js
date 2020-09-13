import { RIBBON_ATTRIBUTE_ADDRESS_AGE } from "../ribbon_attributes_spec.js";
import { clamp } from "../../../../../core/math/MathUtils.js";

/**
 * Fixed function simulation engine for ribbons
 */
export class RibbonXFixedPhysicsSimulator {
    constructor() {

    }

    /**
     *
     * @param {RibbonX} ribbon
     * @param {number} max_age
     * @param {number} timeDelta
     */
    update(ribbon, max_age, timeDelta) {

        const n = ribbon.getCount();
        for (let i = 0; i < n; i++) {

            // age the ribbon
            const age = ribbon.incrementPointAttribute_Scalar(i, RIBBON_ATTRIBUTE_ADDRESS_AGE, timeDelta);

            const relative_age = clamp(age / max_age, 0, 1);

            // apply alpha over-time
            ribbon.setPointAlpha(i, 1.0 - relative_age);
        }


    }
}
