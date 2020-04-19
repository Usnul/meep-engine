import { AsynchronousAction } from "./AsynchronousAction.js";
import TaskState from "../task/TaskState.js";

export class AsynchronousActionSequence extends AsynchronousAction {
    /**
     *
     * @param {AsynchronousAction[]} sequence
     */
    constructor(sequence) {
        super();

        /**
         *
         * @type {AsynchronousAction[]}
         * @private
         */
        this.__sequence = sequence;

        this.__index = 0;

        /**
         *
         * @type {AsynchronousAction|null}
         * @private
         */
        this.__active = null;
    }

    /**
     *
     * @private
     */
    __finalizeActive() {
        this.__index++;
        this.__active = null;
    }

    /**
     *
     * @private
     */
    __handleActiveFinished() {
        this.__finalizeActive();
        this.prod();
    }

    /**
     *
     * @private
     */
    __handleActiveFailed() {
        this.__finalizeActive();
        this.__fail();
    }

    /**
     *
     * @private
     */
    __handleActiveCancelled() {
        this.__finalizeActive();
        this.__fail();
    }

    /**
     *
     */
    prod() {
        if (this.status !== TaskState.RUNNING) {
            return;
        }

        if (this.__index === this.__sequence.length) {
            this.__succeed();
            return;
        }

        if (this.__active === null) {

            this.__active = this.__sequence[this.__index];

            this.__active.on.finished.addOne(this.__handleActiveFinished, this);
            this.__active.on.failed.addOne(this.__handleActiveFailed, this);
            this.__active.on.cancelled.addOne(this.__handleActiveCancelled, this);

            this.__active.start();
        }

    }

    cancel() {

        return new Promise((resolve, reject) => {
            if (this.status === TaskState.RUNNING) {

                this.status = TaskState.CANCELLED;

                this.__active.on.cancelled.remove(this.__handleActiveCancelled, this);
                this.__active.cancel().then(resolve, reject);

                this.on.cancelled.send0();

            } else {
                reject();
            }
        });

    }

    start() {
        super.start();

        this.prod();
    }
}
