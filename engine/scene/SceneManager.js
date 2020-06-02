/**
 * Created by Alex on 21/07/2015.
 */
import { EntityManager } from "../ecs/EntityManager.js";
import Scene from "./Scene.js";
import List from "../../core/collection/List.js";


/**
 *
 * @param {EntityManager} entityManager
 * @param {Clock} clock
 * @constructor
 */
function SceneManager(entityManager, clock) {
    /**
     *
     * @type {Scene|null}
     */
    this.currentScene = null;
    /**
     * @type {List<Scene>}
     */
    this.scenes = new List();
    /**
     *
     * @type {EntityManager}
     */
    this.entityManager = entityManager;

    /**
     *
     * @type {Clock}
     */
    this.clock = clock;

    /**
     * Used to track scene transitions
     * @readonly
     * @private
     * @type {string[]}
     */
    this.stack = [];
}

/**
 *
 * @param {string} name
 * @returns {Scene}
 */
SceneManager.prototype.create = function (name) {
    const scene = new Scene(name);

    this.add(scene);

    return scene;
};

/**
 *
 * @param {Scene} scene
 */
SceneManager.prototype.add = function (scene) {
    if (this.exists(scene.name)) {
        throw new Error(`Scene named '${scene.name}' already exists`);
    }

    this.scenes.add(scene);
};

/**
 *
 * @param {string} name
 * @returns {number}
 */
SceneManager.prototype.indexByName = function (name) {
    const length = this.scenes.length;
    for (let i = 0; i < length; i++) {
        const scene = this.scenes.get(i);

        if (scene.name === name) {
            return i;
        }
    }

    return -1;
};

/**
 * @template T
 * @param {string} name
 * @returns {Scene|T|undefined}
 */
SceneManager.prototype.getByName = function (name) {
    return this.scenes.find(function (scene) {
        return scene.name === name;
    });
};

/**
 *
 * @param {string} name
 * @returns {boolean}
 */
SceneManager.prototype.remove = function (name) {
    const sceneIndex = this.indexByName(name);
    if (sceneIndex === -1) {
        //doesn't exist, no need to delete
        return false;
    }

    const scene = this.scenes.get(sceneIndex);


    if (this.currentScene === scene) {
        this.deactivateCurrentScene();

        this.currentScene = null;
    }

    this.scenes.remove(sceneIndex);

    return true;
};

/**
 *
 * @returns {SceneManager}
 */
SceneManager.prototype.clear = function () {

    if (this.currentScene !== null) {
        this.currentScene.active.set(false);
        this.entityManager.detachDataSet();

        this.currentScene = null;
    }

    return this;
};

/**
 *
 * @param {string} name
 * @returns {boolean}
 */
SceneManager.prototype.exists = function (name) {
    return this.scenes.some(function (scene) {
        return scene.name === name;
    });
};

/**
 * @private
 * @param {Scene} scene
 */
SceneManager.prototype.deactivateScene = function (scene) {

    if (!scene.active.getValue()) {
        //not active, nothing to do
        return;
    }

    try {
        scene.handlePreDeactivation();
    } catch (e) {
        console.error(`Exception in pre-deactivation routine of scene '${scene.name}'`, e);
    }

    scene.active.set(false);

    if (this.entityManager.dataset === scene.dataset) {
        this.entityManager.detachDataSet();
    }

    //remove speed modifiers
    scene.speedModifiers.forEach(m => this.clock.speed.removeModifier(m));

    //unwatch modifiers
    scene.speedModifiers.on.added.remove(this.__handleSpeedModifierAdded, this);
    scene.speedModifiers.on.removed.remove(this.__handleSpeedModifierRemoved, this);

    try {
        scene.handlePostDeactivation();
    } catch (e) {
        console.error(`Exception in post-deactivation routine of scene '${scene.id}'`, e);
    }
};

/**
 * @private
 * @param {Scene} scene
 */
SceneManager.prototype.activateScene = function (scene) {

    try {
        scene.handlePreActivation();
    } catch (e) {
        console.error(`Exception in pre-activation routine of scene '${scene.id}'`, e);
    }

    const em = this.entityManager;

    em.attachDataSet(scene.dataset);

    scene.active.set(true);

    scene.speedModifiers.forEach(m => this.clock.speed.addModifier(m));
    //watch speed modifiers
    scene.speedModifiers.on.added.add(this.__handleSpeedModifierAdded, this);
    scene.speedModifiers.on.removed.add(this.__handleSpeedModifierRemoved, this);


    try {
        scene.handlePostActivation();
    } catch (e) {
        console.error(`Exception in post-activation routine of scene '${scene.id}'`, e);
    }

    this.currentScene = scene;
};

/**
 * @private
 */
SceneManager.prototype.deactivateCurrentScene = function () {

    const currentScene = this.currentScene;

    if (currentScene !== null) {
        this.deactivateScene(currentScene);
    }

};

/**
 * @private
 * @param {LinearModifier} mod
 */
SceneManager.prototype.__handleSpeedModifierAdded = function (mod) {
    this.clock.speed.addModifier(mod);
};

/**
 * @private
 * @param {LinearModifier} mod
 */
SceneManager.prototype.__handleSpeedModifierRemoved = function (mod) {
    this.clock.speed.removeModifier(mod);
};


/**
 *
 * @param {string} name
 */
SceneManager.prototype.set = function (name) {
    const scene = this.getByName(name);

    if (scene === undefined) {
        throw new Error(`Scene named '${name}' doesn't exist, valid options are: [${this.scenes.map(s => s.name).join(', ')}]`);
    }

    if (this.currentScene === scene) {
        //already at that scene
        return;
    }

    const em = this.entityManager;

    this.deactivateCurrentScene();
    this.activateScene(scene);
};

/**
 *
 * @param {string} id
 */
SceneManager.prototype.stackPush = function (id) {
    //take current scene and put it onto the stack
    this.stack.push(this.currentScene.name);

    this.set(id);
};

/**
 *
 * @returns {string} ID of the popped scene
 */
SceneManager.prototype.stackPop = function () {
    const id = this.stack.pop();

    this.set(id);

    return id;
};

/**
 * Clear out current stack of scenes
 */
SceneManager.prototype.stackDrop = function () {
    this.stack.splice(0, this.stack.length);
};

SceneManager.prototype.update = function (timeDelta) {

};

export default SceneManager;
