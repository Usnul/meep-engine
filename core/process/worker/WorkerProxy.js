/**
 * Created by Alex on 21/05/2016.
 */


/**
 *
 * @param {Worker} worker
 * @param {*} message
 * @return {boolean} true if sending was successful, false otherwise
 */
function trySendMessage(worker, message) {
    try {
        worker.postMessage(message);
        return true;
    } catch (e) {
        //request failed
        console.error("failed to send message: ", message, e);
        return false;
    }
}

function needsSerialization(value) {
    if (typeof value !== "object") {
        return false;
    }

    if (value.hasOwnProperty('toJSON') && value.toJSON === "function") {
        return true;
    }

    return false;
}


class WorkerProxy {
    constructor(url, methods) {
        this.url = url;
        this.methods = methods;

        this.__pending = {};
        this.__isRunning = false;
        this.__worker = null;

        /**
         *
         * @type {number}
         * @private
         */
        this.__id_counter = 0;
        //

        this.__handleMessageBound = this.__handleMessage.bind(this);

        this.__generateAPI(this, methods);
    }

    /**
     * @template T
     * @param {number} name
     * @param {[]} args
     * @return {Promise<T>}
     */
    $submitRequest(name, args) {
        const pending = this.__pending[name];

        const argumentCount = args.length;

        const parameters = new Array(argumentCount);

        for (let i = 0; i < argumentCount; i++) {
            const argument = args[i];
            if (needsSerialization(argument)) {
                //use toJSON method on an argument if possible
                parameters[i] = argument.toJSON();
            } else {
                parameters[i] = argument;
            }
        }

        const request_id = this.__id_counter++;

        return new Promise((resolve, reject) => {

            const request = {
                parameters: parameters,
                id: request_id,
                resolve: resolve,
                reject: reject
            };

            pending.push(request);

            if (this.isRunning()) {
                const message = {
                    methodName: name,
                    id: request.id,
                    parameters: parameters
                };

                if (!trySendMessage(this.__worker, message)) {
                    //failed to send message
                    //drop pending request
                    const i = pending.indexOf(request);
                    pending.splice(i, 1);
                }
            }
        });
    }

    __makeMethod(name) {
        const pending = this.__pending[name] = [];

        const proxy = this;

        this[name] = function () {
            return proxy.$submitRequest(name, arguments);
        };

    }

    __generateAPI() {


        for (let methodName in this.methods) {
            if (this.methods.hasOwnProperty(methodName)) {
                this.__makeMethod(methodName);
            }
        }
    }

    /**
     *
     * @param {Event} event
     * @private
     */
    __handleMessage(event) {
        const pending = this.__pending;

        const data = event.data;

        const requestId = data.id;

        const methodName = data.methodName;
        //find pending request queue for method
        const requestQueue = pending[methodName];

        if (requestQueue === undefined) {
            throw new Error('Unexpected method \'' + methodName + '\'');
        } else {

            const n = requestQueue.length;

            for (let i = 0; i < n; i++) {
                const request = requestQueue[i];

                if (request.id === requestId) {
                    //found the right one

                    requestQueue.splice(i, 1);

                    if (data.hasOwnProperty('error')) {
                        request.reject(data.error);
                    } else {
                        request.resolve(data.result);
                    }

                    return;
                }
            }

            throw new Error(`Request ${requestId} not found in the request queue`);
        }
    }

    isRunning() {
        return this.__isRunning;
    }

    stop() {
        if (!this.__isRunning) {
            //not running
            return;
        }
        this.__worker.terminate();
        this.__isRunning = false;
    }

    /**
     *
     * @param {number} id
     * @param {string} methodName
     * @returns {boolean}
     */
    cancelRequest(id, methodName) {
        //find request
        const requestQueue = this.__pending[methodName];

        if (requestQueue === undefined) {
            throw new Error(`No request queue for method name '${methodName}'`);
        }

        const n = requestQueue.length;

        for (let i = 0; i < n; i++) {
            const request = requestQueue[i];

            if (request.id === id) {


                if (!this.__isRunning) {
                    //not running, simply cut from the queue

                    requestQueue.splice(i, 1);

                    return true;
                } else {
                    //worker is running, send termination request for this ID
                    throw new Error('Ability to cancel pending requests while worker is running is not implemented yet');
                }

            }
        }

    }

    sendPendingRequests() {
        for (let methodName in this.__pending) {
            if (this.__pending.hasOwnProperty(methodName)) {

                const pending = this.__pending[methodName];
                const n = pending.length;

                for (let i = 0; i < n; i++) {
                    const request = pending[i];
                    const message = {
                        methodName: methodName,
                        id: request.id,
                        parameters: request.parameters
                    };

                    trySendMessage(this.__worker, message);
                }
            }
        }
    }

    start() {
        if (this.__isRunning) {
            //already running
            return;
        }

        this.__worker = new Worker(this.url);
        this.__worker.onmessage = this.__handleMessageBound;
        this.__isRunning = true;

        this.sendPendingRequests();
    }
}

export default WorkerProxy;
