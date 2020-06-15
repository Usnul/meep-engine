/**
 * Created by Alex on 22/05/2016.
 */


import Signal from '../../events/signal/Signal.js';
import TaskState from './TaskState.js';
import { assert } from "../../assert.js";
import { noop, returnZero } from "../../function/Functions.js";
import TaskSignal from "./TaskSignal.js";
import ObservedInteger from "../../model/ObservedInteger.js";


class Task {
    /**
     *
     * @param {string} name
     * @param {function(Task, executor:*)} [initializer]
     * @param {function():TaskSignal} cycleFunction
     * @param {function():number} [computeProgress]
     * @param {Task[]} [dependencies=[]]
     * @param {number} [estimatedDuration=1]
     * @constructor
     */
    constructor(
        {
            name,
            initializer = noop,
            cycleFunction,
            computeProgress = returnZero,
            dependencies = [],
            estimatedDuration = 1
        }
    ) {

        assert.typeOf(cycleFunction, "function", 'cycleFunction');
        assert.typeOf(estimatedDuration, 'number', 'estimatedDuration');


        this.dependencies = dependencies;

        this.estimatedDuration = estimatedDuration;

        /**
         *
         * @type {string}
         */
        this.name = name;

        /**
         *
         * @type {function(): TaskSignal}
         */
        this.cycle = cycleFunction;

        /**
         *
         * @type {function(Task, executor:{run:function(Task)})}
         */
        this.initialize = initializer;

        this.computeProgress = computeProgress;

        this.on = {
            started: new Signal(),
            completed: new Signal(),
            failed: new Signal()
        };

        /**
         *
         * @type {ObservedInteger}
         */
        this.state = new ObservedInteger(TaskState.INITIAL);

        /**
         * amount of time spent running this task
         * @type {number}
         * @public
         */
        this.__executedCpuTime = 0;
        /**
         * number of time task's cycle function was executed
         * @type {number}
         * @public
         */
        this.__executedCycleCount = 0;
    }

    /**
     * Time in milliseconds that the task has been executing for, suspended time does not count
     * @returns {number}
     */
    getExecutedCpuTime() {
        return this.__executedCpuTime;
    }

    getEstimatedDuration() {
        return this.estimatedDuration;
    }

    /**
     *
     * @param {Task|TaskGroup} task
     * @returns Task
     */
    addDependency(task) {
        assert.notEqual(task, undefined, 'task is undefined');
        assert.notEqual(task, null, 'task is null');


        if (task.isTaskGroup) {

            //is a task group, add all children instead
            this.addDependencies(task.children);

        } else {

            //check that the dependency is not registered yet
            if (this.dependencies.indexOf(task) === -1) {

                this.dependencies.push(task);

            }

        }

        return this;
    }

    /**
     *
     * @param {(Task|TaskGroup)[]} tasks
     */
    addDependencies(tasks) {
        if (!Array.isArray(tasks)) {
            throw new Error(`argument 'tasks' is not an Array`);
        }

        tasks.forEach(t => this.addDependency(t));
    }

    toString() {
        return `Task{name:'${this.name}'}`;
    }

    /**
     *
     * @param {function} resolve
     * @param {function} reject
     */
    join(resolve, reject) {
        Task.join(this, resolve, reject);
    }

    /**
     * Run entire task synchronously to completion
     */
    executeSync() {
        this.initialize();

        let s = this.cycle();

        for (; s !== TaskSignal.EndSuccess && s !== TaskSignal.EndFailure; s = this.cycle()) {
            //keep running
        }

        if (s === TaskSignal.EndSuccess) {
            this.on.completed.dispatch();
        } else if (s === TaskSignal.EndFailure) {
            this.on.failed.dispatch();
        }

        return s;
    }

    /**
     *
     * @param {(Task|TaskGroup)[]} tasks
     * @return {Promise}
     */
    static promiseAll(tasks) {
        const promises = tasks.map(Task.promise);

        return Promise.all(promises);
    }

    /**
     *
     * @param {Task|TaskGroup} task
     */
    static promise(task) {
        return new Promise((resolve, reject) => Task.join(task, resolve, reject));
    }

    /**
     *
     * @param {Task} task
     * @param {function} resolve
     * @param {function} reject
     */
    static join(task, resolve, reject) {
        const state = task.state.getValue();
        if (state === TaskState.SUCCEEDED) {
            resolve();
        } else if (state === TaskState.FAILED) {
            if (reject !== undefined) {
                reject();
            }
        } else {
            task.on.completed.addOne(resolve);
            if (reject !== undefined) {
                task.on.failed.addOne(reject);
            }
        }
    }

    /**
     *
     * @param {Task[]} tasks
     * @param {function} resolve
     * @param {function} reject
     */
    static joinAll(tasks, resolve, reject) {
        let liveCount = tasks.length;

        if (liveCount === 0) {
            //empty input
            resolve();
            return;
        }

        let failedDispatched = false;

        function cbOK() {
            liveCount--;
            if (liveCount <= 0 && !failedDispatched) {
                resolve();
            }
        }

        function cbFailed() {
            if (!failedDispatched) {
                failedDispatched = true;
                reject(arguments);
            }
        }

        for (let i = 0; i < tasks.length; i++) {
            tasks[i].join(cbOK, cbFailed);
        }
    }
}


export default Task;
