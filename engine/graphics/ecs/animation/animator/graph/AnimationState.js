import { AnimationStateType } from "./AnimationStateType.js";
import { BlendStateMatrix } from "../blending/BlendStateMatrix.js";
import { AnimationClipFlag } from "../AnimationClipFlag.js";
import { AnimationEventTypes } from "../AnimationEventTypes.js";

export class AnimationState {
    constructor() {

        /**
         *
         * @type {AnimationStateDefinition}
         */
        this.def = null;

        /**
         *
         * @type {AnimationTransition[]}
         */
        this.inEdges = [];

        /**
         *
         * @type {AnimationTransition[]}
         */
        this.outEdges = [];

        /**
         *
         * @type {AnimationGraph}
         */
        this.graph = null;

        /**
         *
         * @type {BlendStateMatrix}
         */
        this.blendState = null;

        /**
         *
         * @type {number}
         */
        this.time = 0;

        /**
         *
         * @type {number}
         */
        this.timeScale = 1;
    }

    /**
     *
     * @param {AnimationState} other
     * @returns {boolean}
     */
    equals(other) {
        if (this === other) {
            return true;
        }

        return this.def.equals(other.def);
    }

    /**
     *
     * @return {number}
     */
    hash() {
        return this.def.hash();
    }

    initialize() {

        const graphDefinition = this.graph.def;

        const n = graphDefinition.clipIndex.length;

        const matrix = graphDefinition.createBlendState();

        for (let i = 0; i < n; i++) {
            matrix.weights[i] = 0;
            matrix.timeScales[i] = 1;
        }


        this.blendState = matrix;
    }

    updateBlendState() {
        const graphDefinition = this.graph.def;
        const stateDefinition = this.def;

        const matrix = this.blendState;

        if (stateDefinition.type === AnimationStateType.Clip) {

            /**
             *
             * @type {AnimationClip}
             */
            const clip = stateDefinition.motion;

            /**
             *
             * @type {AnimationClipDefinition}
             */
            const clipDefinition = clip.def;

            const clipIndex = graphDefinition.getClipIndex(clipDefinition);

            matrix.weights[clipIndex] = clip.weight;
            matrix.timeScales[clipIndex] = clip.timeScale * this.timeScale;

        }
    }

    /**
     *
     * @param {number} timeDelta in seconds
     */
    tick(timeDelta) {
        const timeBefore = this.time;

        /**
         *
         * @type {AnimationStateDefinition}
         */
        const stateDefinition = this.def;

        /**
         *
         * @type {AnimationGraph}
         */
        const graph = this.graph;

        /**
         *
         * @type {EntityComponentDataset}
         */
        const dataset = graph.__dataset;

        /**
         *
         * @type {number}
         */
        const entity = graph.__entity;

        if (stateDefinition.type === AnimationStateType.Clip) {
            /**
             *
             * @type {AnimationClip}
             */
            const clip = stateDefinition.motion;

            const repeating = clip.getFlag(AnimationClipFlag.Repeat);

            /**
             *
             * @type {AnimationClipDefinition}
             */
            const clipDefinition = clip.def;

            const realTimeDelta = timeDelta * clip.timeScale * this.timeScale;

            const timeAfter = timeBefore + realTimeDelta;

            this.time = timeAfter;

            const notifications = clipDefinition.notifications;

            const notificationCount = notifications.length;


            const clipDuration = clipDefinition.duration;

            const wrappedTimeBefore = timeBefore % clipDuration;
            const wrappedTimeAfter = timeAfter % clipDuration;

            if (repeating || timeBefore < clipDuration) {

                for (let i = 0; i < notificationCount; i++) {
                    const animationNotification = notifications[i];

                    const notificationTime = animationNotification.time;

                    if (
                        (wrappedTimeBefore < wrappedTimeAfter && notificationTime > wrappedTimeBefore && notificationTime <= wrappedTimeAfter)
                        || (wrappedTimeBefore > wrappedTimeAfter && (notificationTime > wrappedTimeBefore || notificationTime <= wrappedTimeAfter))
                    ) {
                        //crossing notification boundary
                        const notificationDefinition = animationNotification.def;

                        dataset.sendEvent(entity, notificationDefinition.event, notificationDefinition.data)
                    }
                }

            }

            if (!repeating) {
                if (timeBefore < clipDuration && timeAfter >= clipDuration) {


                    // Dispatch end of clip event
                    dataset.sendEvent(entity, AnimationEventTypes.ClipEnded, clip);
                }

            }
        }
    }

    /**
     * Executed when state becomes active
     * @param {number} entity
     * @param {EntityComponentDataset} ecd
     */
    activate(entity, ecd) {
        this.time = 0;

        /**
         *
         * @type {AnimationTransition[]}
         */
        const outEdges = this.outEdges;

        const outEdgeCount = outEdges.length;

        for (let i = 0; i < outEdgeCount; i++) {
            const outEdge = outEdges[i];

            outEdge.link(entity, ecd);
        }

    }

    /**
     * Executed when state becomes inactive
     * @param {number} entity
     * @param {EntityComponentDataset} ecd
     */
    deactivate(entity, ecd) {

        /**
         *
         * @type {AnimationTransition[]}
         */
        const outEdges = this.outEdges;

        const outEdgeCount = outEdges.length;

        for (let i = 0; i < outEdgeCount; i++) {
            const outEdge = outEdges[i];

            outEdge.unlink(entity, ecd);
        }

    }
}
