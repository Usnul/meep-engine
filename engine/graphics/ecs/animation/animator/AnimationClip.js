import { computeHashFloat, computeHashIntegerArray } from "../../../../../core/math/MathUtils.js";
import { AnimationClipFlag } from "./AnimationClipFlag.js";
import { LoopOnce, LoopRepeat } from "three";

export class AnimationClip {
    constructor() {
        /**
         *
         * @type {AnimationClipDefinition}
         */
        this.def = null;

        /**
         *
         * @type {number}
         */
        this.weight = 1;

        /**
         *
         * @type {number}
         */
        this.timeScale = 1;

        /**
         *
         * @type {number|AnimationClipFlag}
         */
        this.flags = 0;
    }

    /**
     *
     * @param {AnimationAction} action
     */
    initializeThreeAnimationAction(action) {
        const repeat = this.getFlag(AnimationClipFlag.Repeat);

        action.reset();

        if (repeat) {
            action.loop = LoopRepeat;
            action.repetitions = Infinity;
        } else {
            action.loop = LoopOnce;
            action.repetitions = 1;
            action.clampWhenFinished = true;
        }

        action.play();
    }

    /**
     *
     * @param {number|AnimationClipFlag} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|AnimationClipFlag} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|AnimationClipFlag} flag
     * @param {boolean} value
     */
    writeFlag(flag, value) {
        if (value) {
            this.setFlag(flag);
        } else {
            this.clearFlag(flag);
        }
    }

    /**
     *
     * @param {number|AnimationClipFlag} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }


    /**
     *
     * @param {AnimationClip} other
     * @returns {boolean}
     */
    equals(other) {
        if (this === other) {
            return true;
        }

        return this.weight === other.weight
            && this.timeScale === other.timeScale
            && this.flags === other.flags
            && this.def.equals(other.def)
            ;
    }

    /**
     * @returns {number}
     */
    hash() {
        return computeHashIntegerArray(
            this.flags,
            computeHashFloat(this.weight),
            computeHashFloat(this.timeScale),
            this.def.hash()
        );
    }
}
