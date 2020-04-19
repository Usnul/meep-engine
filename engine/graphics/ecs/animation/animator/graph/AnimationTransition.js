import { BlendStateMatrix } from "../blending/BlendStateMatrix.js";
import { clamp, lerp } from "../../../../../../core/math/MathUtils.js";

export class AnimationTransition {
    constructor() {
        /**
         *
         * @type {AnimationTransitionDefinition}
         */
        this.def = null;

        /**
         *
         * @type {AnimationState}
         */
        this.source = null;

        /**
         *
         * @type {AnimationState}
         */
        this.target = null;

        /**
         *
         * @type {AnimationGraph}
         */
        this.graph = null;

        /**
         * Execution time of the transition, starts at 0 when transition is started
         * @type {number}
         */
        this.time = 0;

        /**
         *
         * @type {BlendStateMatrix}
         */
        this.blendState = null;
    }

    /**
     *
     * @param {AnimationTransition} other
     * @returns {boolean}
     */
    equals(other) {
        if (this === other) {
            return true;
        }

        return this.def.equals(other.def);
    }

    /**
     * @returns {number}
     */
    hash() {
        return this.def.hash();
    }

    initialize() {

        const graphDefinition = this.graph.def;

        this.blendState = graphDefinition.createBlendState();

    }

    start() {
        this.time = 0;
    }

    /**
     *
     * @return {number}
     */
    computeNormalizedTime() {
        return this.time / this.def.duration;
    }

    /**
     *
     * @return {boolean}
     */
    isFinished() {
        return this.time >= this.def.duration;
    }

    updateBlendsState() {
        const t = clamp(this.computeNormalizedTime(), 0, 1);

        BlendStateMatrix.lerp(this.blendState, this.source.blendState, this.target.blendState, t);
    }

    /**
     *
     * @param {number} timeDelta in seconds
     */
    tick(timeDelta) {
        const normalizeTime = this.computeNormalizedTime();

        const actualTimeScale = lerp(this.source.timeScale, this.target.timeScale, normalizeTime);

        const actualTimeDelta = timeDelta * actualTimeScale;

        this.time += actualTimeDelta;
    }

    /**
     * Perform transition
     */
    transition() {
        this.start();
        this.updateBlendsState();


        this.graph.transition(this);
    }

    /**
     *
     * @param {number} entity
     * @param {EntityComponentDataset} ecd
     */
    link(entity, ecd) {
        /**
         *
         * @type {AnimationTransitionDefinition}
         */
        const def = this.def;

        ecd.addEntityEventListener(entity, def.event, this.transition, this);
    }

    /**
     *
     * @param {number} entity
     * @param {EntityComponentDataset} ecd
     */
    unlink(entity, ecd) {

        /**
         *
         * @type {AnimationTransitionDefinition}
         */
        const def = this.def;

        ecd.removeEntityEventListener(entity, def.event, this.transition, this);
    }
}
