/**
 * Created by Alex on 22/05/2016.
 */
import Task from './Task.js';
import TaskSignal from './TaskSignal.js';
import { clamp, seededRandom } from "../../math/MathUtils.js";
import { randomizeArrayElementOrder } from "../../collection/ArrayUtils.js";

/**
 *
 * @param {function} action
 * @param {string} name
 * @return {Task}
 */
export function actionTask(action, name = "unnamed") {
    return new Task({
        name,
        cycleFunction() {
            action();

            return TaskSignal.EndSuccess;
        }
    });
}

/**
 *
 * @param {number} seed RNG seed
 * @param {number|function(*):number} initial
 * @param {number|function(*):number} limit
 * @param {function(index:int)} callback
 * @returns {Task}
 */
export function randomCountTask(seed, initial, limit, callback) {

    const random = seededRandom(seed);

    const span = limit - initial;

    const sequence = new Uint16Array(span);

    let i = 0;

    function cycle() {
        if (i >= span) {
            return TaskSignal.EndSuccess;
        }

        const order = sequence[i];

        const index = order + initial;

        callback(index);

        i++;

        return TaskSignal.Continue;
    }

    return new Task({
        name: `Count ${initial} -> ${limit}`,
        initializer() {

            i = 0;

            //generate sequence
            for (let i = 0; i < span; i++) {
                sequence[i] = i;
            }

            //shuffle
            randomizeArrayElementOrder(random, sequence);
        },
        cycleFunction: cycle,
        computeProgress: function () {

            if (span === 0) {
                return 0;
            }

            return i / span;
        }
    });
}

/**
 *
 * @param {number|function(*):number} initial
 * @param {number|function(*):number} limit
 * @param {function(index:int)} callback
 * @returns {Task}
 */
export function countTask(initial, limit, callback) {
    let initialValue = 0;
    let limitValue = 0;

    let i = initialValue;

    function cycle() {
        if (i >= limitValue) {
            return TaskSignal.EndSuccess;
        }
        callback(i);
        i++;

        return TaskSignal.Continue;
    }

    const initialType = typeof initial;
    const limitType = typeof limit;

    const name = "count (from " + ((initialType === 'number') ? initial : 'variable') + " to " + ((limitType === 'number') ? limit : 'variable') + ")";

    return new Task({
        name: name,
        initializer() {

            if (initialType === "number") {
                initialValue = initial;
            } else if (initialType === "function") {
                initialValue = initial();
            }

            if (limitType === "number") {
                limitValue = limit;
            } else if (limitType === "function") {
                limitValue = limit();
            }

            i = initialValue;

        },
        cycleFunction: cycle,
        computeProgress: function () {
            const span = limitValue - initialValue;

            if (span === 0) {
                return 0;
            }

            return (i - initialValue) / span;
        }
    });
}

/**
 *
 * @param {number} delay in milliseconds
 * @param {string} [name]
 * @returns {Task}
 */
export function delayTask(delay, name = "unnamed") {
    let startTime = -1;

    const estimatedDuration = delay / 1000;
    return new Task({
        name: `delay (${delay}ms): ${name}`,
        initializer() {
            startTime = Date.now();
        },
        cycleFunction() {
            if (Date.now() >= startTime + delay) {
                return TaskSignal.EndSuccess;
            } else {
                return TaskSignal.Yield;
            }
        },
        computeProgress() {
            if (startTime === -1) {
                return 0;
            }

            const currentTime = Date.now();
            const remainingTime = currentTime - startTime;

            let fraction = remainingTime / delay;

            if (Number.isNaN(fraction)) {
                fraction = 0;
            }

            return clamp(fraction, 0, 1);
        },
        estimatedDuration
    });
}

/**
 *
 * @param {string} [name="no-operation"]
 * @returns {Task}
 */
export function emptyTask(name = "no-operation") {
    return new Task({
        name,
        cycleFunction: function () {
            return TaskSignal.EndSuccess;
        },
        computeProgress: function () {
            return 1;
        }
    });
}

/**
 *
 * @param e value to be thrown
 */
export function failingTask(e) {
    return new Task({
        name: "Failing Task",
        cycleFunction: function () {
            throw e;
        },
        computeProgress: function () {
            return 0;
        }
    });
}

/**
 *
 * @param {Future} future
 * @param {String} name
 * @returns {Task}
 */
export function futureTask(future, name) {
    if (typeof future.resolve !== 'function') {
        // Not a future
        throw new Error("No resolve function on the supplied object");
    }

    let resolved = false;
    let rejected = false;
    let error = null;

    future.then(function () {
        resolved = true;
    }, function (e) {
        rejected = true;
        error = e;
    });

    function cycle() {
        future.resolve();
        if (resolved) {
            return TaskSignal.EndSuccess;
        } else if (rejected) {
            throw error;
        } else {
            //give up CPU share
            return TaskSignal.Yield;
        }
    }

    function progress() {
        return resolved ? 1 : 0;
    }

    return new Task({
        name: name,
        cycleFunction: cycle,
        computeProgress: progress
    });
}

/**
 *
 * @param {Promise} promise
 * @param {string} name
 * @returns {Task}
 */
export function promiseTask(promise, name) {
    let resolved = false;
    let rejected = false;
    let error = null;

    promise.then(function () {
        resolved = true;
    }, function (e) {
        rejected = true;
        error = e;
    });

    function cycle() {
        if (resolved) {
            return TaskSignal.EndSuccess;
        } else if (rejected) {
            throw error;
        } else {
            //give up CPU share
            return TaskSignal.Yield;
        }
    }

    function progress() {
        return resolved ? 1 : 0;
    }

    return new Task({
        name: name,
        cycleFunction: cycle,
        computeProgress: progress
    });
}


/**
 *
 * @param {Task} task
 * @returns {Task}
 */
export function wrapTaskIgnoreFailure(task) {
    let initializationFailed = false;

    const wrapper = new Task({
        name: `Ignore Failure of [${task.name}]`,
        initializer() {
            try {
                task.initialize();
            } catch (e) {
                initializationFailed = true;
                console.warn(e);
            }
        },
        estimatedDuration: task.estimatedDuration,
        cycleFunction() {

            task.__executedCpuTime = wrapper.__executedCpuTime;
            task.__executedCycleCount = wrapper.__executedCycleCount;

            if (initializationFailed) {
                //initializer failed, don't execute the source task
                return TaskSignal.EndSuccess;
            }

            const c = task.cycle();

            if (c === TaskSignal.EndFailure) {
                return TaskSignal.EndSuccess;
            }

            return c;
        },
        computeProgress() {
            return task.computeProgress();
        }
    });

    return wrapper;
}
