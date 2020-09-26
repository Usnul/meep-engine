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
