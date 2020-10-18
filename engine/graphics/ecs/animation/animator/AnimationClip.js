import { computeHashFloat, computeHashIntegerArray } from "../../../../../core/math/MathUtils.js";
import { AnimationClipFlag } from "./AnimationClipFlag.js";
import { LoopOnce, LoopRepeat } from "three";
import { AnimationEventTypes } from "./AnimationEventTypes.js";

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
     * @param {number} entity
     * @param {EntityComponentDataset} ecd
     * @param {number} time0
     * @param {number} time1
     */
    dispatchNotifications(entity, ecd, time0, time1) {
        if (time0 === time1) {
            // time interval 0
            return;
        }

        const repeating = this.getFlag(AnimationClipFlag.Repeat);

        /**
         *
         * @type {AnimationClipDefinition}
         */
        const clipDefinition = this.def;

        /**
         *
         * @type {AnimationNotification[]}
         */
        const notifications = clipDefinition.notifications;

        const notificationCount = notifications.length;

        const clipDuration = clipDefinition.duration;


        if (notificationCount > 0) {

            let t = time0;

            let time_end = time1;

            let dispatch_flag;

            if (!repeating) {
                time_end = clipDuration;
            }


            replay:while (t < time_end) {

                const cycle_index = (t / clipDuration) | 0;

                const cycle_start_time = cycle_index * clipDuration;

                dispatch_flag = false;

                for (let i = 0; i < notificationCount; i++) {
                    const animationNotification = notifications[i];

                    const notificationTime = animationNotification.time;

                    const event_time = notificationTime + cycle_start_time;

                    if (event_time > time_end) {
                        // event is past the end time of the interval
                        break replay;
                    } else if (event_time <= t) {
                        // event is in the past, skip
                        continue;
                    }

                    //crossing notification boundary
                    const notificationDefinition = animationNotification.def;

                    ecd.sendEvent(entity, notificationDefinition.event, notificationDefinition.data);

                    t = event_time;

                    dispatch_flag = true;
                }

                if (!dispatch_flag) {
                    // nothing dispatched
                    t += clipDuration;
                }

            }

        }

        if (!repeating && time0 < clipDuration && time1 > clipDuration) {

            // Dispatch end of clip event
            ecd.sendEvent(entity, AnimationEventTypes.ClipEnded, this);

        }
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
