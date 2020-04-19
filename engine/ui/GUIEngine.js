/**
 * Created by Alex on 07/09/2016.
 */


import List from '../../core/collection/List.js';

import GUIElement from '../ecs/gui/GUIElement.js';
import ViewportPosition from '../ecs/gui/ViewportPosition.js';

import EntityBuilder from '../ecs/EntityBuilder.js';

import ConfirmationDialogView from '../../view/elements/ConfirmationDialogView.js';
import SimpleWindowView from '../../view/elements/SimpleWindow.js';

import View from '../../view/View.js';
import TransitionFunctions from "../animation/TransitionFunctions.js";
import AnimationTrack from "../animation/keyed2/AnimationTrack.js";
import AnimationTrackPlayback from "../animation/keyed2/AnimationTrackPlayback.js";
import { playTrackRealTime } from "../animation/AnimationUtils.js";
import { TooltipManager } from "../../view/tooltip/TooltipManager.js";
import { DomTooltipManager } from "../../view/tooltip/DomTooltipManager.js";
import Ticker from "../simulation/Ticker.js";
import { SimpleLifecycle, SimpleLifecycleStateType } from "../../core/process/SimpleLifecycle.js";
import { OverlayPageGUI } from "../../../model/game/scenes/strategy/gui/OverlayPageGUI.js";
import ObservedBoolean from "../../core/model/ObservedBoolean.js";
import EmptyView from "../../view/elements/EmptyView.js";
import LinearModifier from "../../core/model/stat/LinearModifier.js";
import { GMLEngine } from "../../view/tooltip/GMLEngine.js";
import ObservedString from "../../core/model/ObservedString.js";
import { CursorType } from "./cursor/CursorType.js";
import { noop } from "../../core/function/Functions.js";
import { SerializationMetadata } from "../ecs/components/SerializationMetadata.js";
import { SceneGUIContext } from "./scene/SceneGUIContext.js";


/**
 * @readonly
 * @enum {string}
 */
export const NotificationAreaKind = {
    Primary: 'primary',
    Secondary: 'secondary',
    Toast: 'toast'
};

function GUIEngine() {
    this.windows = new List();

    /**
     * When set to 'true' - indicated that GUI engine should be the only one receiving the inputs, this is useful for Modal dialogs and other overlays
     * @readonly
     * @type {ObservedBoolean}
     */
    const captureInputs = this.captureInputs = new ObservedBoolean(false);

    /**
     *
     * @type {EntityManager|null}
     */
    this.entityManager = null;

    /**
     *
     * @type {Engine}
     */
    this.engine = null;

    const pageGUI = this.pages = new OverlayPageGUI();
    pageGUI.visible = false;

    pageGUI.on.lastRemoved.add(function () {
        pageGUI.visible = false;
        //restore controls
        captureInputs.set(false);
    });

    pageGUI.on.firstAdded.add(function () {
        pageGUI.visible = true;
        //disable scene controls
        captureInputs.set(true);
    });

    /**
     *
     * @type {WeakMap<Scene, SceneGUIContext>}
     */
    this.sceneContexts = new WeakMap();

    /**
     *
     * @type {TooltipManager}
     */
    this.tooltips = new TooltipManager();

    /**
     *
     * @type {DomTooltipManager}
     */
    this.viewTooltips = new DomTooltipManager(this.tooltips);


    /**
     *
     * @type {Ticker}
     */
    this.ticker = new Ticker();
    this.ticker.subscribe(d => {


        let ctx = null;
        try {
            ctx = this.getActiveSceneContext();
        } catch (e) {
            //skip
        }

        if (ctx !== null) {
            ctx.tick(d);
        }
    });

    this.view = new EmptyView({ classList: ['gui-engine-root'] });

    /**
     *
     * @type {GMLEngine}
     */
    this.gml = new GMLEngine();

    /**
     *
     * @type {ObservedString}
     */
    this.cursor = new ObservedString(CursorType.Normal);


    /**
     *
     * @type {Localization|null}
     */
    this.localization = null;
}

/**
 * @param {boolean} closeable
 * @param {View} content
 * @param {string} title
 * @param {View} [wrapper]
 * @returns {EntityBuilder}
 */
GUIEngine.prototype.openWindow = function ({ closeable, content, title, wrapper }) {
    const entityBuilder = new EntityBuilder();

    function closeAction() {
        entityBuilder.destroy();
    }

    const windowView = new SimpleWindowView(content, {
        closeAction,
        title,
        closeable
    });

    entityBuilder.add(new ViewportPosition());

    let vElement;
    if (wrapper !== undefined) {
        vElement = wrapper;
        wrapper.addChild(windowView);
    } else {
        vElement = windowView;
    }

    const guiElement = GUIElement.fromView(vElement);
    entityBuilder.add(guiElement)
        .add(SerializationMetadata.Transient);

    const dataset = this.entityManager.dataset;

    animateView(windowView, dataset);

    entityBuilder.build(dataset);

    return entityBuilder;
};

/**
 *
 * @param {View} view
 * @param {EntityComponentDataset} ecd
 */
function animateView(view, ecd) {

    const animationTrack = new AnimationTrack(["alpha", "scale"]);
    animationTrack.addKey(0, [0, 0.95]);
    animationTrack.addKey(0.2, [1, 1]);

    animationTrack.addTransition(0, TransitionFunctions.Linear);

    const playback = new AnimationTrackPlayback(animationTrack, function (alpha, scale) {
        this.el.style.opacity = alpha;
        this.scale.set(scale, scale);
    }, view);

    //force view status to initial key of animation
    playback.update();

    playTrackRealTime(playback, ecd);
}

/**
 *
 * @param {View} content
 * @param {string} title
 * @param {number} priority
 * @returns {SimpleLifecycle}
 */
GUIEngine.prototype.createModal = function ({ content, title, priority = 0 }) {
    const entityManager = this.entityManager;

    const self = this;
    let window = null;
    let overlay = null;


    function destroy() {
        window.destroy();
        overlay.destroy();
    }

    function makeOverlay() {
        const overlay = new View();
        overlay.el = document.createElement('div');
        overlay.el.classList.add('ui-modal-overlay');
        //make overlay dismiss modal
        overlay.el.addEventListener('click', function (event) {
            event.stopPropagation();
            lifecycle.makeDestroyed();
        });

        const builder = new EntityBuilder();

        builder.add(SerializationMetadata.Transient);
        builder.add(GUIElement.fromView(overlay));
        return builder;
    }

    function build() {
        overlay = makeOverlay();

        overlay.build(entityManager.dataset);

        const view = content;

        const vModalContainer = new EmptyView({ classList: ['ui-modal-window-container'] });

        window = self.openWindow({
            title: title,
            content: view,
            closeable: false,
            wrapper: vModalContainer
        });

        const windowGuiElement = window.getComponent(GUIElement);
        windowGuiElement.anchor.set(0.5, 0.5);

        window.removeComponent(ViewportPosition);

    }

    const lifecycle = new SimpleLifecycle({ priority });

    lifecycle.sm.addEventHandlerStateEntry(SimpleLifecycleStateType.Active, build);
    lifecycle.sm.addEventHandlerStateExit(SimpleLifecycleStateType.Active, destroy);

    this.getActiveSceneContext().modals.add(lifecycle);

    return lifecycle;
};

/**
 *
 * @param {string} title
 * @param {string} text
 * @param {View} content
 * @returns {Promise<any>}
 */
GUIEngine.prototype.createModalConfirmation = function ({ title, content }) {

    const self = this;

    let lifecycle = null;


    const result = new Promise(function (resolve, reject) {
        //make view

        let resolved = false;

        function clear() {
            lifecycle.makeDestroyed();
        }

        function callbackYes() {
            resolved = true;
            clear();
            resolve();
        }

        function callbackNo() {
            resolved = true;
            clear();
            reject();
        }

        const view = new ConfirmationDialogView(content,
            [{
                name: "yes",
                displayName: self.localization.getString("system_confirmation_confirm"),
                callback: callbackYes
            }, {
                name: "no",
                displayName: self.localization.getString("system_confirmation_cancel"),
                callback: callbackNo
            }]
        );

        lifecycle = self.createModal({
            content: view,
            title: title
        });

        lifecycle.sm.addEventHandlerStateEntry(SimpleLifecycleStateType.Destroyed, function () {
            if (!resolved) {
                //if destroyed without resolution, reject the promise
                reject();
            }
        });
    });


    return result;
};


function createTextView(text) {
    const content = new View();
    content.el = document.createElement('div');
    content.el.classList.add('text');
    content.el.innerText = text;

    content.size.set(300, 100);
    return content;
}

/**
 * @param {string} text
 * @param {string} title
 * @returns {Promise} will be resolved or rejected based on user choice
 */
GUIEngine.prototype.confirmTextDialog = function ({ text, title }) {
    const content = createTextView(text);

    return this.createModalConfirmation({
        title,
        content: content
    });
};

/**
 *
 * @param {string} text
 * @param {string} title
 * @returns {Promise}
 */
GUIEngine.prototype.createTextAlert = function ({ text, title }) {
    const content = createTextView(text);
    return this.createAlert({
        content,
        title
    });
};

/**
 *
 * @param {View} content
 * @param {string} title
 * @param {View[]} [marks]
 * @param {number} priority
 * @param {function(SimpleLifecycle)} [lifecycleHook]
 * @returns {Promise}
 */
GUIEngine.prototype.createAlert = function (
    {
        content,
        title,
        marks = [],
        priority = 0,
        lifecycleHook = noop
    }
) {
    /**
     *
     * @type {SimpleLifecycle|null}
     */
    let lifecycle = null;

    function clear() {
        lifecycle.makeDestroyed();
    }

    const localization = this.localization;

    const view = new ConfirmationDialogView(content,
        [{
            name: "ok",
            displayName: localization.getString("system_confirmation_continue"),
            callback: clear
        }]
    );

    if (marks.length > 0) {
        const vMarks = new EmptyView({ classList: ['marks'] });

        marks.forEach(vMarks.addChild, vMarks);

        view.addChild(vMarks);
    }


    lifecycle = this.createModal({
        content: view,
        title,
        priority
    });

    const result = new Promise(function (resolve, reject) {
        lifecycle.sm.addEventHandlerStateEntry(SimpleLifecycleStateType.Destroyed, resolve);
    });

    lifecycleHook(lifecycle);

    return result;
};

/**
 *
 * @param {Scene} scene
 * @return {SceneGUIContext}
 */
GUIEngine.prototype.obtainSceneContext = function (scene) {

    let context = this.sceneContexts.get(scene);

    if (context === undefined) {
        context = new SceneGUIContext();

        context.initialize(scene);
        context.startup();

        this.sceneContexts.set(scene, context);
    }

    return context;
};

/**
 * @returns {SceneGUIContext}
 */
GUIEngine.prototype.getActiveSceneContext = function () {
    const engine = this.engine;

    if (engine === null) {
        throw new Error(`Engine is not set`);
    }

    const sm = engine.sceneManager;

    const scene = sm.currentScene;

    if (scene === null) {
        throw new Error(`No active scene`);
    }

    return this.obtainSceneContext(scene);
};

/**
 *
 * @param {Engine} engine
 */
GUIEngine.prototype.startup = function (engine) {
    this.engine = engine;
    this.entityManager = engine.entityManager;

    const self = this;

    /**
     *
     * @type {Localization}
     */
    const localization = engine.localization;

    this.gml.initialize(engine.staticKnowledge, localization);

    this.tooltips.initialize(this.gml, engine.devices.pointer);

    //attach tooltips to GML
    this.gml.tooltips = this.viewTooltips;

    this.view.addChild(this.tooltips.contextView);

    this.view.addChild(this.pages);

    engine.gameView.addChild(this.view);

    engine.gameView.size.process(function (x, y) {
        self.view.size.set(x, y);

        self.tooltips.contextView.size.set(x, y);

        self.pages.updateSize(x, y);
    });

    this.ticker.start();


    const clockModifier = new LinearModifier(0, 0);

    function stopSimulation() {

        //pause the clock
        engine.ticker.clock.speed.addModifier(clockModifier);

    }

    function resumeSimulation() {

        //restore game clock speed
        engine.ticker.clock.speed.removeModifier(clockModifier);

    }

    this.pages.localizaiton = localization;
    this.pages.on.lastRemoved.add(resumeSimulation);

    this.pages.on.firstAdded.add(stopSimulation);


    this.localization = localization;


    //register cursor propagation
    this.cursor.process(function (newValue, oldValue) {
        function className(cursorName) {
            return `cursor-${cursorName}`;
        }

        const classList = engine.graphics.domElement.classList;

        if (typeof oldValue === 'string') {
            classList.remove(className(oldValue));
        }

        if (typeof newValue === 'string') {
            classList.add(className(newValue));
        }
    });

    return Promise.all([
        this.tooltips.startup()
    ]);
};

GUIEngine.prototype.shutdown = function () {
    this.windows.reset();
    this.entityManager = null;

    const pTooltips = this.tooltips.shutdown();

    return Promise.all([
        pTooltips
    ]);
};

export default GUIEngine;
