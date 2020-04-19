import Task from "../../../core/process/task/Task.js";
import TaskSignal from "../../../core/process/task/TaskSignal.js";

export class OptimizationTask extends Task {
    /**
     *
     * @param {RandomOptimizer} optimizer
     * @param {number} [threshold] number of retries without improvement before optimization is considered completed
     */
    constructor(optimizer, threshold = 100) {
        super({
            name: 'Optimization',
            cycleFunction
        });

        let attempts = threshold;

        function cycleFunction() {
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
