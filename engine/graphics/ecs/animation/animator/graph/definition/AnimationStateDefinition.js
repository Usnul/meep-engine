import { AnimationStateType } from "../AnimationStateType.js";
import { computeHashIntegerArray } from "../../../../../../../core/math/MathUtils.js";

export class AnimationStateDefinition {
    constructor() {
        /**
         * Arbitrary free-form text name. Used for identification purposes
         * @type {string}
         */
        this.name = "";

        /**
         * Edges coming in
         * @type {AnimationTransitionDefinition[]}
         */
        this.inEdges = [];

        /**
         * Edges going out
         * @type {AnimationTransitionDefinition[]}
         */
        this.outEdges = [];

        this.type = AnimationStateType.Unknown;

        /**
         *
         * @type {string[]}
         */
        this.tags = [];

        /**
         *
         * @type {AnimationClip|BlendSpace}
         */
        this.motion = null;
    }

    /**
     *
     * @param {string[]} tags
     * @returns {number}
     */
    countMatchingTags(tags) {
        let result = 0;

        const m = this.tags.length;

        const n = tags.length;

        for (let i = 0; i < n; i++) {
            const t0 = tags[i];

            for (let j = 0; j < m; j++) {
                const t1 = this.tags[j];

                if (t0 === t1) {
                    result++;
                    break;
                }

            }
        }

        return result;
    }

    /**
     *
     * @param {AnimationStateDefinition} other
     * @returns {boolean}
     */
    equals(other) {
        if (this === other) {
            return true;
        }

        return this.type === other.type
            && this.motion.equals(other.motion)
            ;
    }

    /**
     * @returns {number}
     */
    hash() {
        return computeHashIntegerArray(
            this.type,
            this.motion.hash()
        );
    }
}
