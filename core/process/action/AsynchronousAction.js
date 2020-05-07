import Signal from "../../events/signal/Signal.js";
import TaskState from "../task/TaskState.js";
import { IllegalStateException } from "../../fsm/exceptions/IllegalStateException.js";

export class AsynchronousAction {
    constructor() {

        this.on = {
            finished: new Signal(),
            failed: new Signal(),
            cancelled: new Signal()
        };

        /**
         * @protected
         * @type {TaskState|number}
         */
        this.status = TaskState.INITIAL;

        /**
         *
         * @type {*}
         * @private
         */
        this.__failureReason = null;
    }

    isRunning() {
        return this.status === TaskState.RUNNING;
    }

    /**
     *
     * @return {Promise}
     */
    promise() {
        if (this.status === TaskState.SUCCEEDED) {
            return Promise.resolve();
        } else if (this.status === TaskState.FAILED || this.status === TaskState.CANCELLED) {
            return Promise.reject();
        } else {
            return new Promise((resolve, reject) => {

                this.on.finished.add(resolve);

                this.on.failed.add(reject);
                this.on.cancelled.add(reject);

            });
        }
    }

    /**
     *
     * @protected
     */
    __succeed() {
        if (this.status !== TaskState.RUNNING) {
            throw new IllegalStateException();
        }


        this.status = TaskState.SUCCEEDED;
        this.on.finished.send0();
    }

    /**
     *
     * @protected
     */
    __fail(reason) {
        if (this.status !== TaskState.RUNNING) {
            throw new IllegalStateException();
        }

        this.__failureReason = reason;

        this.status = TaskState.FAILED;
        this.on.failed.send1(reason);
    }

    start() {
        this.status = TaskState.RUNNING;
    }

    /**
     * @returns {Promise}
     */
    cancel() {
        throw new Error('Unsupported operation');
    }
}
