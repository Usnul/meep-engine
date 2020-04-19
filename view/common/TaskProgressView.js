/**
 * Created by Alex on 25/08/2016.
 */


import View from '../View.js';
import SmoothProgressBar from '../elements/SmoothProgressBar.js';
import LabelView from './LabelView.js';

import TaskState from '../../core/process/task/TaskState.js';

import dom from '../DOM.js';
import Clock from "../../engine/Clock.js";
import Vector1 from "../../core/geom/Vector1.js";
import { LocalizedLabelView } from "./LocalizedLabelView.js";

function ReimaingTimeEstimator(sampleCount) {
    this.sampleCount = sampleCount;
    this.rates = new Float32Array(sampleCount);
    this.cursor = 0;
}

ReimaingTimeEstimator.prototype.update = function (timeElapsed, progress) {
    const index = this.cursor;
    this.cursor = (this.cursor + 1) % this.sampleCount;

    const rate = progress / timeElapsed;

    this.rates[index] = rate;
};

ReimaingTimeEstimator.prototype.estimate = function (currentProgress) {
    let rateSum = 0;

    for (let i = 0; i < this.sampleCount; i++) {
        rateSum += this.rates[i];
    }

    const rate = rateSum / this.sampleCount;

    if (rate === 0) {
        return Infinity;
    }

    const result = (1 - currentProgress) / rate;

    return result;
};

class TaskProgressView extends View {
    /**
     *
     * @param {Task|TaskGroup} task
     * @param {Localization} localization
     * @constructor
     */
    constructor({ task, localization }) {
        super(task, localization);

        const self = this;

        function makeNameId() {
            const taskName = typeof task.name === "string" ? task.name : "unknown";

            return `system_task.${taskName.replace(/ /g, '_')}.name`
        }

        const taskName = new LocalizedLabelView({
            id: makeNameId(),
            localization,
            classList: ['name']
        });

        const progressBar = new SmoothProgressBar();

        function processFailure() {
            //find failed subtasks/dependencies
            if (task.children !== undefined) {
                const failedChildren = task.children.filter(function (t) {
                    return t.state.getValue() === TaskState.FAILED;
                });
                failedChildren.forEach(function (t) {
                    self.addChild(new LabelView("Failed subtask: " + t.name));
                });
            }

        }

        /**
         *
         * @param {TaskState} state
         */
        function getStateName(state) {

            for (let stateName in TaskState) {
                if (TaskState[stateName] === state) {
                    return stateName;
                }
            }

            return "Unknown State";
        }

        const state = new LabelView(task.state, {
            format: function (v) {
                return getStateName(v);
            },
            classList: ['state']
        });

        function updateState() {

            function className(n) {
                return `state-${n}`;
            }

            for (let stateName in TaskState) {
                state.removeClass(className(stateName));
            }

            const v = task.state.getValue();

            if (v === TaskState.FAILED) {
                processFailure();
            }

            const name = getStateName(v);
            state.addClass(className(name));
        }

        state.on.linked.add(updateState);
        state.bindSignal(task.state.onChanged, updateState);

        const remainingTimeEstimator = new ReimaingTimeEstimator(100);
        const remainingTime = new Vector1(0);

        const lRemainingTime = new LabelView(remainingTime, {
            format: function (v) {
                return v.toFixed(0);
            },
            classList: ['remaining-time']
        });

        this.el = dom().addClass('task-progress-view').el;

        this.addChild(taskName);
        this.addChild(state);
        this.addChild(progressBar);
        this.addChild(lRemainingTime);

        progressBar.max = 1;

        const clock = new Clock();

        clock.start();

        function update() {
            const computedProgressValue = task.computeProgress();

            const taskProgress = Number.isNaN(computedProgressValue) ? 0 : computedProgressValue;

            progressBar.value = taskProgress;

            remainingTimeEstimator.update(clock.getElapsedTime(), taskProgress);

            const computedEstimate = remainingTimeEstimator.estimate(taskProgress);

            const estimate = Number.isNaN(computedEstimate) ? 0 : computedProgressValue;

            remainingTime.set(estimate);

            const state = task.state.getValue();

            if (state !== TaskState.FAILED && state !== TaskState.SUCCEEDED && self.isLinked) {
                requestAnimationFrame(update);
            }
        }

        this.on.linked.add(update);
    }
}


export default TaskProgressView;
