/**
 * Created by Alex on 11/08/2015.
 */


import { EntityComponentDataset } from "../ecs/EntityComponentDataset.js";
import { promiseTask } from "../../core/process/task/TaskUtils.js";
import ObservedBoolean from "../../core/model/ObservedBoolean.js";
import List from "../../core/collection/List.js";

class Scene {
    /**
     *
     * @param {string} name
     * @constructor
     */
    constructor(name) {
        /**
         *
         * @type {string}
         */
        this.name = name;
        /**
         *
         * @type {EntityComponentDataset}
         */
        this.dataset = new EntityComponentDataset();

        /**
         * @readonly
         * @type {ObservedBoolean}
         */
        this.active = new ObservedBoolean(false);

        /**
         * Flag used to signal that the scene was been destroyed and should no longer be used
         * @type {boolean}
         */
        this.destroyed = false;

        /**
         * Clock modifiers
         * @type {List<LinearModifier>}
         */
        this.speedModifiers = new List();
    }

    /**
     * Executed just before the scene is is activated
     */
    handlePreActivation() {
        //implement in subclass
    }

    /**
     * Executed just after scene is activate
     */
    handlePostActivation() {
        //implement in subclass
    }

    /**
     * Executed just before scene is deactivated
     */
    handlePreDeactivation() {
        //implement in subclass
    }

    /**
     * Executed just after scene is deactivated
     */
    handlePostDeactivation() {
        //implement in subclass
    }

    /**
     *
     * @param options
     * @param {Engine} engine
     * @param {function} success
     * @param {function} failure
     * @returns {Task|TaskGroup}
     */
    setup(options, engine, success, failure) {
        //empty by default
        return promiseTask(new Promise(function (resolve, reject) {
            success();
            resolve();
        }), `${name} scene setup`);
    }

    teardown(engine, success, failure) {
    }

    clear() {
        this.dataset.clear();
    }
}

export default Scene;
