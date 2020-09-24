export class DomElementBindingDescription {
    constructor() {
        /**
         * css selector
         * @type {string}
         */
        this.selector = "*";


        /**
         *
         * @type {function(Element):DomElementProcessor}
         */
        this.processor = null;
    }


    /**
     *
     * @param {string} selector
     * @param {function(Element):DomElementProcessor} processor
     * @return {DomElementBindingDescription}
     */
    static from({
                    selector,
                    processor
                }) {

        const r = new DomElementBindingDescription();

        r.selector = selector;
        r.processor = processor;

        return r;
    }

}
