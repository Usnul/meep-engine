export class OnDemandWorkerManager {

    /**
     *
     * @param {WorkerProxy} worker
     */
    constructor(worker) {
        /**
         * @type {WorkerProxy}
         */
        this.worker = worker;

        /**
         * Number of active pending requests
         * @type {number}
         * @private
         */
        this.__request_count = 0;

        /**
         * How long to wait before terminating the worker after it becomes idle
         * in milliseconds
         * @type {number}
         * @private
         */
        this.__timeout = 1000;

        this.__decrement = this.decrement.bind(this);
        this.__terminate = this.terminate.bind(this);

        /**
         * ID of the timer set via setTimeout
         * @type {number}
         * @private
         */
        this.__pending_termination = -1;
    }

    /**
     * @private
     */
    terminate() {
        this.cancelScheduledTermination();

        this.worker.stop();

    }

    /**
     * @private
     */
    cancelScheduledTermination() {

        if (this.__pending_termination >= 0) {

            clearInterval(this.__pending_termination);

            this.__pending_termination = -1;

        }
    }

    /**
     *
     * @param {number} timeout
     */
    scheduleTermination(timeout) {
        this.cancelScheduledTermination();

        this.__pending_termination = setTimeout(this.__terminate, timeout);
    }

    /**
     * @private
     */
    decrement() {
        this.__request_count--;

        if (this.__request_count <= 0 && this.worker.isRunning()) {
            this.scheduleTermination(this.__timeout);
        }
    }

    /**
     * @private
     */
    increment() {
        this.__request_count++;

        if (!this.worker.isRunning()) {
            this.worker.start();
        } else if (this.__pending_termination >= 0) {

            clearInterval(this.__pending_termination);
            this.__pending_termination = -1;

        }
    }


    /**
     * @template T
     * @param {string} name
     * @param {[]} [parameters]
     * @return {Promise<T>}
     */
    request(name, parameters) {

        this.increment();

        const promise = this.worker.$submitRequest(name, parameters);

        promise.finally(this.__decrement);

        return promise;
    }
}
