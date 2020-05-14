import Task from "../../../core/process/task/Task.js";
import TaskSignal from "../../../core/process/task/TaskSignal.js";

export class OptimizationTask extends Task {
    /**
     *
     * @param {RandomOptimizer} optimizer
     * @param {number} [threshold] number of retries without improvement before optimization is considered completed
     * @param {number} timeLimit maximum number of seconds the task is allowed to run
     */
    constructor(optimizer, threshold = 100, timeLimit = 60) {
        super({
            name: 'Optimization',
            cycleFunction,
            computeProgress
        });

        let attempts = threshold;

        const self = this;

        const timeoutInMs = timeLimit * 1000;

        function computeProgress() {
            return self.getExecutedCpuTime() / timeoutInMs;
        }

        function cycleFunction() {

            if (self.getExecutedCpuTime() > timeoutInMs) {
                return TaskSignal.EndFailure;
            }

            const step = optimizer.step();

            if (step) {
                attempts = threshold;
            } else {
                attempts--;
                if (attempts <= 0) {
                    //finish
                    return TaskSignal.EndSuccess;
                }
            }

            return TaskSignal.Continue;
        }
    }
}
