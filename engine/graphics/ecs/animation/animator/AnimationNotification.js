import { computeHashFloat, computeHashIntegerArray } from "../../../../../core/math/MathUtils.js";

export class AnimationNotification {
    constructor() {
        /**
         *
         * @type {AnimationNotificationDefinition}
         */
        this.def = null;

        /**
         * When the notification is to be sent
         * @type {number}
         */
        this.time = 0;
    }

    /**
     *
     * @param {AnimationNotification} other
     * @returns {boolean}
     */
    equals(other) {
        if (this === other) {
            return true;
        }

        return this.time === other.time
            && this.def.equals(other.def)
            ;
    }

    /**
     * @returns {number}
     */
    hash() {
        return computeHashIntegerArray(
            computeHashFloat(this.time),
            this.def.hash()
        );
    }
}
