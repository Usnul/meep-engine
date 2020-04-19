import { BinaryClassSerializationAdapter } from "../../../../../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import { AnimationGraphDefinition } from "../AnimationGraphDefinition.js";
import { AnimationNotificationDefinition } from "../../../AnimationNotificationDefinition.js";
import { AnimationNotification } from "../../../AnimationNotification.js";
import { AnimationClip } from "../../../AnimationClip.js";
import { AnimationClipDefinition } from "../../../AnimationClipDefinition.js";
import { AnimationStateDefinition } from "../AnimationStateDefinition.js";
import { AnimationTransitionDefinition } from "../AnimationTransitionDefinition.js";

export class AnimationGraphDefinitionSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = AnimationGraphDefinition;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {AnimationGraphDefinition} graph
     */
    serialize(buffer, graph) {


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

        graph.traverseClips(clip => {

            const clipDefinition = clip.def;

            if (clips.indexOf(clipDefinition) === -1) {
                clips.push(clipDefinition);


                clipDefinition.notifications.forEach(notification => {
                    const notificationDefinition = notification.def;

                    if (notifications.indexOf(notificationDefinition) === -1) {
                        notifications.push(notificationDefinition);
                    }
                })
            }

        });


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


        // write notifications
        const notificationCount = notifications.length;

        buffer.writeUintVar(notificationCount);

        for (let i = 0; i < notificationCount; i++) {
            const def = notifications[i];

            buffer.writeUTF8String(def.event);
            buffer.writeUTF8String(JSON.stringify(def.data));
        }

        // write clips
        const clipCount = clips.length;

        buffer.writeUintVar(clipCount);

        for (let i = 0; i < clipCount; i++) {
            const def = clips[i];

            buffer.writeUTF8String(def.name);
            buffer.writeFloat32(def.duration);

            const animationNotifications = def.notifications;
            const n = animationNotifications.length;

            buffer.writeUintVar(n);

            for (let j = 0; j < n; j++) {
                const animationNotification = animationNotifications[j];

                const notificationDefinitionIndex = notifications.indexOf(animationNotification.def);

                buffer.writeFloat32(animationNotification.time);
                buffer.writeUintVar(notificationDefinitionIndex);
            }
        }

        // write states
        const stateCount = states.length;

        buffer.writeUintVar(stateCount);

        for (let i = 0; i < stateCount; i++) {
            const def = states[i];

            buffer.writeUint8(def.type);

            /**
             *
             * @type {AnimationClip}
             */
            const clip = def.motion;

            const clipDefinitionIndex = clips.indexOf(clip.def);

            buffer.writeUintVar(clipDefinitionIndex);
            buffer.writeUint32(clip.flags);

            buffer.writeFloat32(clip.weight);
            buffer.writeFloat32(clip.timeScale);

        }

        // write transitions
        const transitionCount = transitions.length;

        buffer.writeUintVar(transitionCount);

        for (let i = 0; i < transitionCount; i++) {
            const def = transitions[i];

            buffer.writeUTF8String(def.event);
            buffer.writeFloat32(def.duration);

            const sourceIndex = states.indexOf(def.source);
            const targetIndex = states.indexOf(def.target);

            buffer.writeUintVar(sourceIndex);
            buffer.writeUintVar(targetIndex);
        }


        const startingStateIndex = states.indexOf(graph.startingSate);

        buffer.writeUintVar(startingStateIndex)
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {AnimationGraphDefinition} value
     */
    deserialize(buffer, value) {
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
        const states = [];

        /**
         *
         * @type {AnimationTransitionDefinition[]}
         */
        const transitions = [];

        // Read notifications
        const notificationCount = buffer.readUintVar();

        for (let i = 0; i < notificationCount; i++) {
            const event = buffer.readUTF8String();
            const dataJSON = buffer.readUTF8String();

            const data = JSON.parse(dataJSON);

            const def = new AnimationNotificationDefinition();
            def.event = event;
            def.data = data;

            notifications.push(def);
        }

        // Read clips
        const clipCount = buffer.readUintVar();

        for (let i = 0; i < clipCount; i++) {
            const name = buffer.readUTF8String();
            const duration = buffer.readFloat32();

            const n = buffer.readUintVar();

            const clip = new AnimationClipDefinition();

            const clipNotifications = clip.notifications;

            for (let j = 0; j < n; j++) {
                const time = buffer.readFloat32();
                const notificationIndex = buffer.readUintVar();

                const notification = new AnimationNotification();

                notification.def = notifications[notificationIndex];
                notification.time = time;

                clipNotifications.push(notification);
            }


            clip.name = name;
            clip.duration = duration;

            clips.push(clip);
        }

        // Read states
        const stateCount = buffer.readUintVar();

        for (let i = 0; i < stateCount; i++) {
            const type = buffer.readUint8();

            const clipDefinitionIndex = buffer.readUintVar();
            const flags = buffer.readUint32();
            const weight = buffer.readFloat32();
            const timeScale = buffer.readFloat32();

            const state = new AnimationStateDefinition();

            const clip = new AnimationClip();

            clip.def = clips[clipDefinitionIndex];
            clip.weight = weight;
            clip.timeScale = timeScale;
            clip.flags = flags;

            state.type = type;
            state.motion = clip;

            states.push(state);
        }

        // Read transitions
        const transitionCount = buffer.readUintVar();

        for (let i = 0; i < transitionCount; i++) {
            const event = buffer.readUTF8String();
            const duration = buffer.readFloat32();

            const sourceIndex = buffer.readUintVar();
            const targetIndex = buffer.readUintVar();

            const transition = new AnimationTransitionDefinition();
            transition.event = event;
            transition.duration = duration;

            const source = states[sourceIndex];
            const target = states[targetIndex];

            transition.source = source;
            transition.target = target;

            target.inEdges.push(transition);
            source.outEdges.push(transition);

            transitions.push(transition);
        }

        const startingStateIndex = buffer.readUintVar();

        value.states = states;
        value.transitions = transitions;
        value.startingSate = states[startingStateIndex];

        value.build();
    }
}
