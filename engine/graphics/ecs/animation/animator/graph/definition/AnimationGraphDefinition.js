import { AnimationStateType } from "../AnimationStateType.js";
import { BlendStateMatrix } from "../../blending/BlendStateMatrix.js";
import { AnimationStateDefinition } from "./AnimationStateDefinition.js";
import { AnimationClipDefinition } from "../../AnimationClipDefinition.js";
import { AnimationClip } from "../../AnimationClip.js";
import { isArrayEqual } from "../../../../../../../core/collection/ArrayUtils.js";
import { computeHashArray, computeHashIntegerArray } from "../../../../../../../core/math/MathUtils.js";
import { invokeObjectHash } from "../../../../../../../core/model/ObjectUtils.js";

export class AnimationGraphDefinition {
    constructor() {
        /**
         *
         * @type {AnimationStateDefinition[]}
         */
        this.states = [];

        /**
         *
         * @type {AnimationTransitionDefinition[]}
         */
        this.transitions = [];

        /**
         *
         * @type {AnimationStateDefinition}
         */
        this.startingSate = null;

        /**
         *
         * @type {AnimationClipDefinition[]}
         */
        this.clipIndex = [];
    }

    /**
     *
     * @param {AnimationGraphDefinition} other
     * @returns {boolean}
     */
    equals(other) {
        if (this === other) {
            return true;
        }

        return this.startingSate.equals(other.startingSate)
            && isArrayEqual(this.states, other.states)
            && isArrayEqual(this.transitions, other.transitions)
            ;
    }

    /**
     * @returns {number}
     */
    hash() {
        return computeHashIntegerArray(
            this.startingSate.hash(),
            computeHashArray(this.states, invokeObjectHash),
            computeHashArray(this.transitions, invokeObjectHash)
        );
    }

    /**
     *
     * @return {BlendStateMatrix}
     */
    createBlendState() {
        return new BlendStateMatrix(this.clipIndex.length);
    }

    /**
     *
     * @param {AnimationClipDefinition} def
     * @returns {number}
     */
    getClipIndex(def) {
        return this.clipIndex.indexOf(def);
    }

    build() {
        //construct clip index
        this.clipIndex = [];
        this.traverseClips(c => {
            /**
             *
             * @type {AnimationClipDefinition}
             */
            const clipDefinition = c.def;

            if (this.clipIndex.indexOf(clipDefinition) === -1) {
                this.clipIndex.push(clipDefinition);
            }
        });
    }

    /**
     *
     * @param {function(AnimationClip)} visitor
     * @param {*} [thisArg]
     */
    traverseClips(visitor, thisArg) {
        this.states.forEach(state => {

            if (state.type === AnimationStateType.Clip) {
                visitor(state.motion);
            } else {
                throw new Error(`Unsupported stat type`);
            }

        });
    }

    /**
     *
     * @param {AnimationStateDefinition} state
     */
    addState(state) {
        if (this.containsState(state)) {
            return false;
        } else {
            this.states.push(state);
        }

        if (this.startingSate === null) {
            this.startingSate = state;
        }
    }

    /**
     *
     * @param {AnimationStateDefinition} state
     * @return {boolean}
     */
    containsState(state) {
        return this.states.indexOf(state) !== -1;
    }

    /**
     *
     * @param {AnimationStateDefinition} state
     * @returns {boolean}
     */
    removeState(state) {
        const i = this.states.indexOf(state);

        if (i === -1) {
            return false;
        }

        this.states.splice(i, 1);

        return true;
    }
}
