import { AnimationNotificationDefinition } from "../../../AnimationNotificationDefinition.js";
import { AnimationClipDefinition } from "../../../AnimationClipDefinition.js";
import { AnimationNotification } from "../../../AnimationNotification.js";
import { AnimationStateDefinition } from "../AnimationStateDefinition.js";
import { AnimationClip } from "../../../AnimationClip.js";
import { AnimationTransitionDefinition } from "../AnimationTransitionDefinition.js";
import { AnimationGraphDefinition } from "../AnimationGraphDefinition.js";

/**
 *
 * @param {[]} states
 * @param {[]} transitions
 * @param {[]} clips
 * @param {[]} notifications
 * @param {number} startingState
 *
 * @returns {AnimationGraphDefinition}
 */
export function readAnimationGraphDefinitionFromJSON(
    {
        states = [],
        transitions = [],
        clips = [],
        notifications = [],
        startingState = 0
    }
) {
    /**
     *
     * @type {AnimationNotificationDefinition[]}
     * @private
     */
    const __notifications = notifications.map(jNotification => {
        const _n = new AnimationNotificationDefinition();

        _n.event = jNotification.event;

        if (jNotification.data !== undefined) {
            _n.data = jNotification.data;
        }

        return _n;
    });

    /**
     *
     * @type {AnimationClipDefinition[]}
     * @private
     */
    const __clips = clips.map(jClip => {
        const _c = new AnimationClipDefinition();

        _c.name = jClip.name;
        _c.duration = jClip.duration;
        _c.notifications = jClip.notifications.map(jNotification => {
            const _n = new AnimationNotification();

            _n.def = __notifications[jNotification.def];
            _n.time = jNotification.time;

            return _n;
        });

        return _c;
    });

    /**
     *
     * @type {AnimationStateDefinition[]}
     * @private
     */
    const __states = states.map(jState => {
        const state = new AnimationStateDefinition();

        const motion = jState.motion;

        const animationClip = new AnimationClip();

        animationClip.def = __clips[motion.def];
        animationClip.timeScale = motion.timeScale;
        animationClip.weight = motion.weight;
        animationClip.flags = motion.flags;

        state.type = jState.type;
        state.motion = animationClip;

        return state;
    });

    /**
     *
     * @type {AnimationTransitionDefinition[]}
     * @private
     */
    const __transitions = transitions.map(jTransition => {
        const transition = new AnimationTransitionDefinition();

        transition.event = jTransition.event;

        if (typeof jTransition.duration === "number") {
            transition.duration = jTransition.duration;
        } else {
            transition.duration = 0;
        }

        const source = __states[jTransition.source];
        const target = __states[jTransition.target];

        transition.source = source;
        transition.target = target;

        source.outEdges.push(transition);
        target.inEdges.push(transition);

        return transition;
    });


    //assemble the graph
    const graph = new AnimationGraphDefinition();

    graph.transitions = __transitions;
    graph.states = __states;
    graph.startingSate = __states[startingState];

    graph.build();

    return graph;
}
