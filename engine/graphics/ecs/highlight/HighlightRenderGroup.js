import List from "../../../../core/collection/List.js";

export class HighlightRenderGroup {
    constructor() {
        /**
         *
         * @type {List<HighlightRenderElement>}
         */
        this.elements = new List();
    }

    /**
     *
     * @returns {boolean}
     */
    isEmpty() {
        return this.elements.isEmpty();
    }

    /**
     *
     * @param {HighlightRenderElement} element
     */
    add(element) {
        this.elements.add(element);
    }

    clear() {
        this.elements.reset();
    }
}
