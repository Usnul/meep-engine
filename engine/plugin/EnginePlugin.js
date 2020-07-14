import { BaseProcess } from "../../core/process/BaseProcess.js";
import { assert } from "../../core/assert.js";

export class EnginePlugin extends BaseProcess {
    attach() {
        /**
         * Must be unique for each plugin
         * @type {string}
         */
        this.id = "";

        /**
         *
         * @type {Engine}
         */
        this.engine = null;
    }

    /**
     *
     * @param {Engine} engine
     */
    initialize(engine) {
        assert.defined(engine, 'engine');
        assert.notNull(engine, 'engine');
        assert.equal(engine.isEngine, true, '.isEngine !== true');

        this.engine = engine;

        super.initialize();
    }

    finalize() {
        super.finalize();
    }


    /**
     *
     * @return {Promise}
     */
    startup() {
        super.startup();

        return Promise.resolve();
    }


    /**
     *
     * @return {Promise}
     */
    shutdown() {
        super.shutdown();

        return Promise.resolve();
    }
}
