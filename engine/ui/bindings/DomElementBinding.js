export class DomElementBinding {
    constructor() {

        /**
         *
         * @type {Element}
         */
        this.element = null;

        /**
         *
         * @type {DomElementBindingDescription}
         */
        this.description = null;

        /**
         *
         * @type {DomElementProcessor}
         */
        this.processor = null;
    }

    bind() {
        this.processor.el = this.element;
        this.processor.startup();
    }

    unbind() {

        this.processor.shutdown();
    }
}
