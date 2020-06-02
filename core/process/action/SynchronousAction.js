import { AsynchronousAction } from "./AsynchronousAction.js";
import { assert } from "../../assert.js";

export class SynchronousAction extends AsynchronousAction {
    /**
     *
     * @param {function()} factory
     */
    constructor(factory) {
        super();

        assert.typeOf(factory, 'function', 'factory');

        /**
         *
         * @type {function()}
         * @private
         */
        this.__factory = factory;
    }

    start() {
        super.start();

        try {
            this.__factory();
        } catch (e) {
            this.__fail(e);
            return;
        }

        this.__succeed();
    }

    cancel() {
        return Promise.resolve();
    }
}
