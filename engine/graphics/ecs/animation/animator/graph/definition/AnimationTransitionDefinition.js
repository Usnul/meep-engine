import { computeHashFloat, computeHashIntegerArray } from "../../../../../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../../../../../core/primitives/strings/StringUtils.js";

export class AnimationTransitionDefinition {
    constructor() {
        /**
         *
         * @type {string}
         */
        this.event = "";

        /**
         *
         * @type {number}
         */
        this.duration = 0.2;


        /**
         *
         * @type {AnimationStateDefinition}
         */
        this.source = null;

        /**
         *
         * @type {AnimationStateDefinition}
         */
        this.target = null;
    }

    /**
     *
     * @param {AnimationTransitionDefinition} other
     * @returns {boolean}
     */
    equals(other) {
        if (this === other) {
            return true;
        }

        return this.event === other.event
            && this.duration === other.duration
            && this.source.equals(other.source)
            && this.target.equals(other.target)
            ;
    }

    /**
     * @returns {number}
     */
    hash() {
        return computeHashIntegerArray(
            computeStringHash(this.event),
            computeHashFloat(this.duration),
            this.source.hash(),
            this.target.hash()
        );
    }
}
