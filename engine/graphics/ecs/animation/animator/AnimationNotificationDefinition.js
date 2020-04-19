import { objectDeepEquals } from "../../../../../core/model/ObjectUtils.js";
import { computeHashIntegerArray, computeObjectHash } from "../../../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../../../core/primitives/strings/StringUtils.js";

export class AnimationNotificationDefinition {
    constructor() {
        /**
         * Event name to be dispatched during the notification
         * @type {string}
         */
        this.event = "";

        /**
         * Data to be sent with the event
         * @type {*}
         */
        this.data = {};
    }

    /**
     *
     * @param {AnimationNotificationDefinition} other
     * @returns {boolean}
     */
    equals(other) {
        if (this === other) {
            return true;
        }

        return this.event === other.event
            && objectDeepEquals(this.data, other.data);
    }

    /**
     * @returns {number}
     */
    hash() {
        return computeHashIntegerArray(
            computeStringHash(this.event),
            computeObjectHash(this.data)
        );
    }
}
