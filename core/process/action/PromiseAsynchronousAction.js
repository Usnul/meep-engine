import { AsynchronousAction } from "./AsynchronousAction.js";
import { assert } from "../../assert.js";

export class PromiseAsynchronousAction extends AsynchronousAction {
    /**
     *
     * @param {function():Promise} factory
     */
    constructor(factory) {
        super();

        assert.typeOf(factory, 'function', 'factory');

        /**
         *
         * @type {function(): Promise}
         * @private
         */
        this.__factory = factory;
    }

    start() {
        super.start();

        let p;

        try {
            p = this.__factory();
        } catch (e) {
            this.__fail(e);
            return;
        }

        assert.defined(p, 'factory result');
        assert.notNull(p, 'factory result');
        assert.typeOf(p, 'object', 'p');
        assert.typeOf(p.then, 'function', 'p.then');

        p.then(
            () => {
                this.__succeed();
            },
            () => {
                this.__fail();
            }
        );
    }
}
