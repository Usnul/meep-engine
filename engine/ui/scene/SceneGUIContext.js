import { ModalStack } from "../modal/ModalStack.js";
import LinearModifier from "../../../core/model/stat/LinearModifier.js";
import { NotificationManager } from "../notification/NotificationManager.js";
import ViewEmitter from "../notification/ViewEmitter.js";
import AnimationTrack from "../../animation/keyed2/AnimationTrack.js";
import TransitionFunctions from "../../animation/TransitionFunctions.js";
import { assert } from "../../../core/assert.js";
import NotificationView from "../../../../view/ui/elements/notify/NotificationView.js";
import { NotificationAreaKind } from "../GUIEngine.js";

/**
 *
 * @param {NotificationManager} manager
 */
function initializeNotifications(manager) {
    function makePrimary() {
        const viewEmitter = new ViewEmitter();
        viewEmitter.setRushThreshold(1);

        const animationTrack = new AnimationTrack(["alpha", "scale"]);
        animationTrack.addKey(0, [0, 1.3]);
        animationTrack.addKey(0.6, [1, 1]);
        animationTrack.addKey(3.8, [1, 1]);
        animationTrack.addKey(4.3, [0, 1]);

        animationTrack.addTransition(0, TransitionFunctions.EaseIn);
        animationTrack.addTransition(2, TransitionFunctions.EaseOut);

        viewEmitter.setAnimation(animationTrack, function (alpha, scale) {
            /**
             * @type View
             */
            const view = this;

            view.el.style.opacity = alpha;
            view.scale.set(scale, scale);
        });

        viewEmitter.viewFactory = function (options) {
            assert.notEqual(options, undefined, 'options is undefined');

            const notificationView = new NotificationView(options);

            return notificationView;
        };


        return viewEmitter;
    }

    function makeSecondary() {
        const viewEmitter = new ViewEmitter();
        viewEmitter.setRushThreshold(1);

        const animationTrack = new AnimationTrack(["alpha", "position.y", "scale"]);
        animationTrack.addKey(0, [0.2, 0, 1.1]);
        animationTrack.addKey(0.17, [1, 0, 1]);
        animationTrack.addKey(3, [1, -60, 1]);
        animationTrack.addKey(3.5, [0, -70, 1]);

        animationTrack.addTransition(0, TransitionFunctions.EaseIn);
        animationTrack.addTransition(1, TransitionFunctions.Linear);
        animationTrack.addTransition(2, TransitionFunctions.EaseOut);

        viewEmitter.setAnimation(animationTrack, function (alpha, positionY, scale) {
            /**
             * @type View
             */
            const view = this;

            view.el.style.opacity = alpha;
            view.position.setY(positionY);
            view.scale.set(scale, scale);
        });


        viewEmitter.viewFactory = function (options) {
            const notificationView = new NotificationView(options);

            return notificationView;
        };

        return viewEmitter;
    }


    function makeToast() {
        const displayDuration = 7;

        const viewEmitter = new ViewEmitter();
        viewEmitter.setRushThreshold(5);

        const animationTrack = new AnimationTrack(["alpha", "position.x"]);
        animationTrack.addKey(0, [0.2, 100]);
        animationTrack.addKey(0.17, [1, 0]);
        animationTrack.addKey(displayDuration, [1, 0]);
        animationTrack.addKey(displayDuration + 0.5, [0, 0]);

        animationTrack.addTransition(0, TransitionFunctions.EaseIn);
        animationTrack.addTransition(1, TransitionFunctions.Linear);
        animationTrack.addTransition(2, TransitionFunctions.EaseOut);

        viewEmitter.setAnimation(animationTrack, function (alpha, positionY) {
            /**
             * @type View
             */
            const view = this;

            view.el.style.opacity = alpha;
            view.position.setX(positionY);
        });


        viewEmitter.viewFactory = function (options) {
            const notificationView = new NotificationView(options);

            return notificationView;
        };

        return viewEmitter;
    }

    manager.createChannel(NotificationAreaKind.Primary);
    manager.createChannel(NotificationAreaKind.Secondary);
    manager.createChannel(NotificationAreaKind.Toast);

    manager.addEmitterDisplay(NotificationAreaKind.Primary, makePrimary());
    manager.addEmitterDisplay(NotificationAreaKind.Secondary, makeSecondary());
    manager.addEmitterDisplay(NotificationAreaKind.Toast, makeToast(), 'managed-toast-notifications');

    // testNotifications(manager);
}

export class SceneGUIContext {
    constructor() {
        /**
         *
         * @type {Scene}
         */
        this.scene = null;
        this.modals = new ModalStack();

        /**
         *
         * @type {NotificationManager}
         */
        this.notifications = new NotificationManager();

        this.clockModifierZero = new LinearModifier(0, 0);
    }

    /**
     *
     * @param {Scene} scene
     */
    initialize(scene) {
        this.scene = scene;

        initializeNotifications(this.notifications);

        this.notifications.ecd = scene.dataset;
    }

    /**
     *
     * @param {number} timeDelta
     */
    tick(timeDelta){
        this.notifications.tick(timeDelta);
    }

    /**
     * @private
     */
    stopTime() {
        this.scene.speedModifiers.add(this.clockModifierZero);
    }

    /**
     * @private
     */
    resumeTime() {
        this.scene.speedModifiers.removeOneOf(this.clockModifierZero);
    }

    startup() {
        this.modals.on.firstAdded.add(this.stopTime, this);
        this.modals.on.lastRemoved.add(this.resumeTime, this);
    }

    shutdown() {
        this.modals.on.firstAdded.remove(this.stopTime, this);
        this.modals.on.lastRemoved.remove(this.resumeTime, this);
    }
}
