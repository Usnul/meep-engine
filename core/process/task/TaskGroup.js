/**
 * Created by Alex on 19/08/2016.
 */
import Signal from '../../events/signal/Signal.js';
import TaskState from './TaskState.js';
import Task from './Task.js';
import { assert } from "../../assert.js";
import ObservedInteger from "../../model/ObservedInteger.js";

/**
 *
 * @param {Task[]} subtasks
 * @param {string} [name]
 * @constructor
 */
function TaskGroup(subtasks, name = 'Unnamed') {
    assert.ok(Array.isArray(subtasks));

    /**
     *
     * @type {string}
     */
    this.name = name;

    /**
     *
     * @type {(Task|TaskGroup)[]}
     */
    this.children = subtasks;


    const self = this;

    this.computeProgress = function () {
        const children = self.children;
        const numChildren = children.length;
        let progressSum = 0;
        let progressTotal = 0;
        for (let i = 0; i < numChildren; i++) {
            const child = children[i];
            const estimatedDuration = child.getEstimatedDuration();

            if (isNaN(estimatedDuration)) {
                //Duration is not a number, ignore this child
                continue;
            }

            const childProgress = child.computeProgress();

            assert.ok(childProgress >= 0 && childProgress <= 1, `Expected progress to be between 0 and 1, instead was '${childProgress}' for child '${child.name}'`);

            progressSum += childProgress * estimatedDuration;
            progressTotal += estimatedDuration;
        }

        if (progressTotal === 0) {
            return 0;
        } else {
            return progressSum / progressTotal;
        }

    };

    this.on = {
        started: new Signal(),
        completed: new Signal(),
        failed: new Signal()
    };

    this.state = new ObservedInteger(TaskState.INITIAL);
}

/**
 *
 * @param {Task|TaskGroup} child
 * @returns {boolean}
 */
TaskGroup.prototype.addChild = function (child) {
    if (this.children.indexOf(child) !== -1) {
        return false;
    }

    this.children.push(child);

    return true;
};

/**
 *
 * @param {(Task|TaskGroup)[]} children
 */
TaskGroup.prototype.addChildren = function (children) {
    const n = children.length;
    for (let i = 0; i < n; i++) {
        const child = children[i];
        this.addChild(child);
    }
};

/**
 * @readonly
 * @type {boolean}
 */
TaskGroup.prototype.isTaskGroup = true;

/**
 *
 * @param {Task|TaskGroup} dependency
 */
TaskGroup.prototype.addDependency = function (dependency) {

    if (dependency.isTaskGroup) {
        this.addDependencies(dependency.children);
    } else {
        const children = this.children;

        const n = children.length;

        for (let i = 0; i < n; i++) {
            const child = children[i];

            child.addDependency(dependency);
        }
    }

};

TaskGroup.prototype.addDependencies = function (dependencies) {

    const n = dependencies.length;

    for (let i = 0; i < n; i++) {
        const dependency = dependencies[i];

        this.addDependency(dependency);
    }

};

TaskGroup.prototype.getEstimatedDuration = function () {
    return this.children.reduce(function (s, child) {
        const childDuration = child.getEstimatedDuration();

        if (isNaN(childDuration) || childDuration < 0) {
            return s;
        } else {
            return s + childDuration;
        }

    }, 0);
};

/**
 *
 * @param resolve
 * @param reject
 */
TaskGroup.prototype.join = function (resolve, reject) {
    Task.join(this, resolve, reject);
};

/**
 *
 * @returns {Promise<unknown>}
 */
TaskGroup.prototype.promise = function () {
    return Task.promise(this);
};

export default TaskGroup;
