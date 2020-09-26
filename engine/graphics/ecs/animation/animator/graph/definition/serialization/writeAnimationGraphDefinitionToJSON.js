/**
 *
 * @param {AnimationGraphDefinition} graph
 * @returns {Object}
 */
export function writeAnimationGraphDefinitionToJSON(graph) {
    /**
     *
     * @type {AnimationNotificationDefinition[]}
     */
    const notifications = [];

    /**
     *
     * @type {AnimationClipDefinition[]}
     */
    const clips = [];

    /**
     *
     * @type {AnimationStateDefinition[]}
     */
    const states = graph.states;

    /**
     *
     * @type {AnimationTransitionDefinition[]}
     */
    const transitions = graph.transitions;

    graph.traverseClips(clip => {
        const clipDefinition = clip.def;

        if (clips.indexOf(clipDefinition) === -1) {
            clips.push(clipDefinition);

            clipDefinition.notifications.forEach(notification => {
                const notificationDefinition = notification.def;

                if (notifications.indexOf(notificationDefinition) === -1) {
                    notifications.push(notificationDefinition);
                }
            });
        }
    });

    const jNotifications = notifications.map(n => {
        return {
            event: n.event,
            data: n.data
        };
    });

    const jClips = clips.map(c => {
        return {
            name: c.name,
            duration: c.duration,
            tags: c.tags,
            notifications: c.notifications.map(n => {
                return {
                    def: notifications.indexOf(n.def),
                    time: n.time
                };
            })
        };
    });

    const jStates = states.map(s => {
        const motion = s.motion;

        return {
            type: s.type,
            motion: {
                def: clips.indexOf(motion.def),
                timeScale: motion.timeScale,
                weight: motion.weight,
                flags: motion.flags
            }
        };
    });

    const jTransitions = transitions.map(t => {


        return {
            event: t.event,
            duration: t.duration,
            source: states.indexOf(t.source),
            target: states.indexOf(t.target)
        };
    });

    return {
        states: jStates,
        transitions: jTransitions,
        clips: jClips,
        notifications: jNotifications,
        startingSate: states.indexOf(graph.startingSate)
    };
}
