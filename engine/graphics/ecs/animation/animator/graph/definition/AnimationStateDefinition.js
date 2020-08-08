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
         * @type {AnimationClip|BlendSpace}
         */
        this.motion = null;
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
