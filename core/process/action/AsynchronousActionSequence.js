import { AsynchronousAction } from "./AsynchronousAction.js";
import TaskState from "../task/TaskState.js";
import { assert } from "../../assert.js";

export class AsynchronousActionSequence extends AsynchronousAction {
    /**
     *
     * @param {AsynchronousAction[]} sequence
     */
    constructor(sequence) {
        super();

        assert.isArray(sequence);

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
        // remove listeners
        this.__active.on.finished.remove(this.__handleActiveFinished, this);
        this.__active.on.failed.remove(this.__handleActiveFailed, this);
        this.__active.on.cancelled.remove(this.__handleActiveCancelled, this);

        // advance sequence cursor
        this.__index++;

        // clear active
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
    __handleActiveFailed(reason) {
        this.__finalizeActive();
        this.__fail(reason);
    }

    /**
     *
     * @private
     */
    __handleActiveCancelled() {
        this.__finalizeActive();

        this.status = TaskState.CANCELLED;
        this.on.cancelled.send0();
    }

    /**
     *
     */
    prod() {
        if (this.status !== TaskState.RUNNING) {
            return;
        }

        if (this.__index === this.__sequence.length) {
            // reached end of sequence
            this.__succeed();
            return;
        }

        if (this.__active === null) {

            this.__active = this.__sequence[this.__index];

            if (this.__active.status === TaskState.CANCELLED) {
                this.__handleActiveCancelled();
            } else {

                this.__active.on.finished.addOne(this.__handleActiveFinished, this);
                this.__active.on.failed.addOne(this.__handleActiveFailed, this);
                this.__active.on.cancelled.addOne(this.__handleActiveCancelled, this);

                try {
                    this.__active.start();
                } catch (e) {
                    // an element failed during start-up sequence
                    this.__handleActiveFailed(e);
                }

            }
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
