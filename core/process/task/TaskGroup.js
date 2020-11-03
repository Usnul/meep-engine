/**
 * Created by Alex on 19/08/2016.
 */
import Signal from '../../events/signal/Signal.js';
import TaskState from './TaskState.js';
import Task from './Task.js';
import { assert } from "../../assert.js";
import ObservedInteger from "../../model/ObservedInteger.js";
import LineBuilder from "../../codegen/LineBuilder.js";
import { objectKeyByValue } from "../../model/ObjectUtils.js";

/**
 *
 * @param {Task[]} subtasks
 * @param {string} [name]
 * @constructor
 */
function TaskGroup(subtasks, name = 'Unnamed') {
    assert.isArray(subtasks, 'subtasks');
    assert.typeOf(name, 'string', 'name');

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

    this.on = {
        started: new Signal(),
        completed: new Signal(),
        failed: new Signal()
    };

    this.state = new ObservedInteger(TaskState.INITIAL);
}

/**
 * Time in milliseconds that the task has been executing for, suspended time does not count
 * @returns {number}
 */
TaskGroup.prototype.getExecutedCpuTime = function () {
    let result = 0;

    const children = this.children;
    const n = children.length;

    for (let i = 0; i < n; i++) {
        const child = children[i];

        const time = child.getExecutedCpuTime();

        result += time;
    }

    return result;
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

/**
 *
 * @returns {number}
 */
TaskGroup.prototype.getEstimatedDuration = function () {
    let result = 0;
    const children = this.children;
    const n = children.length;
    for (let i = 0; i < n; i++) {

        const child = children[i];

        const childDuration = child.getEstimatedDuration();

        if (!(isNaN(childDuration) || childDuration < 0)) {
            result += childDuration;
        }

    }

    return result;
};

/**
 * Dumps task group tree along with state of each task
 * @returns {string}
 */
TaskGroup.prototype.getVerboseStatusMessage = function () {
    const b = new LineBuilder();

    /**
     *
     * @param {Task|TaskGroup} t
     */
    function addTask(t) {
        if (t.isTaskGroup) {
            b.add(`group ['${t.name}']`)
            b.indent();
            for (let i = 0; i < t.children.length; i++) {
                addTask(t.children[i]);
            }
            b.dedent();
        } else {
            b.add(`task ['${t.name}'] ${objectKeyByValue(TaskState, t.state.getValue())}`)
        }
    }

    addTask(this);

    return b.build();
};


TaskGroup.prototype.computeProgress = function () {
    const children = this.children;
    const numChildren = children.length;

    let progressSum = 0;
    let progressTotal = 0;

    for (let i = 0; i < numChildren; i++) {
        /**
         *
         * @type {Task|TaskGroup}
         */
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
