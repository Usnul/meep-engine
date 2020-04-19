import { Behavior } from "../Behavior.js";

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
     * @param {Behavior} v
     */
    setSource(v) {
        this.__source = v;
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
