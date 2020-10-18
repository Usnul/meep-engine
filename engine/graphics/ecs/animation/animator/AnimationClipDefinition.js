import { isArrayEqual } from "../../../../../core/collection/ArrayUtils.js";
import { computeHashArray, computeHashIntegerArray } from "../../../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../../../core/primitives/strings/StringUtils.js";
import { invokeObjectHash } from "../../../../../core/model/ObjectUtils.js";

/**
 *
 * @param {AnimationNotification} a
 * @param {AnimationNotification} b
 * @returns {number}
 */
function compareByTime(a, b) {
    return b.time - a.time;
}

export class AnimationClipDefinition {
    constructor() {
        /**
         *
         * @type {string}
         */
        this.name = "";

        /**
         * Generic string tags
         * @type {string[]}
         */
        this.tags = [];

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

    sortNotification() {
        this.notifications.sort(compareByTime);
    }

    /**
     *
     * @param {string} name
     * @return {number}
     */
    countNotificationsByName(name) {
        let result = 0;

        const notifications = this.notifications;
        const n = notifications.length;
        for (let i = 0; i < n; i++) {
            const notification = notifications[i];

            if (notification.def.event === name) {
                result++;
            }

        }

        return result;
    }

    /**
     *
     * @param {string} tag
     * @return {boolean}
     */
    hasTag(tag) {
        const tags = this.tags;

        const n = tags.length;

        for (let i = 0; i < n; i++) {
            const t = tags[i];

            if (t === tag) {
                return true;
            }
        }

        return false;
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
            && isArrayEqual(this.tags, other.tags)
            ;
    }

    /**
     * @returns {number}
     */
    hash() {
        return computeHashIntegerArray(
            computeStringHash(this.name),
            computeHashArray(this.notifications, invokeObjectHash),
            computeHashArray(this.tags, computeStringHash)
        );
    }
}
