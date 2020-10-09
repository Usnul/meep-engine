import { Behavior } from "../Behavior.js";
import { assert } from "../../../../core/assert.js";

export class AbstractDecoratorBehavior extends Behavior {
    constructor() {
        super();

        /**
         *
         * @type {Behavior}
         * @protected
         */
        this.__source = null;
    }

    /**
     *
     * @return {Behavior}
     */
    getSource() {
        return this.__source;
    }

    /**
     *
     * @param {Behavior} source
     */
    setSource(source) {
        assert.defined(source, 'source');

        assert.equal(source.isBehavior, true, 'source.isBehavior');

        this.__source = source;
    }

    initialize(context) {
        super.initialize(context);
        this.__source.initialize(context);

        this.__status = this.__source.getStatus();
    }

    finalize() {
        super.finalize();

        this.__source.finalize();
    }
}
