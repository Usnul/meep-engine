import { isArrayEqual } from "../../../../../core/collection/ArrayUtils.js";
import { computeHashArray, computeHashIntegerArray } from "../../../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../../../core/primitives/strings/StringUtils.js";
import { invokeObjectHash } from "../../../../../core/model/ObjectUtils.js";

export class AnimationClipDefinition {
    constructor() {
        /**
         *
         * @type {string}
         */
        this.name = "";

        /**
         *
         * @type {number}
         */
        this.duration = 0;

        /**
         *
         * @type {AnimationNotification[]}
         */
        this.notifications = [];
    }

    /**
     *
     * @param {AnimationClipDefinition} other
     * @returns {boolean}
     */
    equals(other) {
        if (this === other) {
            return true;
        }

        return this.name === other.name
            && isArrayEqual(this.notifications, other.notifications)
            ;
    }

    /**
     * @returns {number}
     */
    hash() {
        return computeHashIntegerArray(
            computeStringHash(this.name),
            computeHashArray(this.notifications, invokeObjectHash)
        );
    }
}
