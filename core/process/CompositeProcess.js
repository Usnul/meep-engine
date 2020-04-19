import { BaseProcess } from "./BaseProcess.js";

export class CompositeProcess extends BaseProcess {
    /**
     *
     * @param {BaseProcess[]} children
     */
    constructor(children) {
        super();


        /**
         * @readonly
         * @protected
         * @type {BaseProcess[]}
         */
        this.children = children.slice();
    }

    initialize(ctx) {
        this.children.forEach(c => c.initialize(ctx));

        super.initialize();

    }

    finalize() {

        this.children.forEach(c => c.finalize());

        super.finalize();
    }

    startup() {

        this.children.forEach(c => c.startup());

        super.startup();
    }

    shutdown() {

        this.children.forEach(c => c.shutdown());

        super.startup();
    }
}
