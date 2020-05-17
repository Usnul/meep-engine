/**
 * Created by Alex on 20/09/2015.
 */
import List from "../../../../core/collection/List.js";
import { HighlightDefinition } from "./HighlightDefinition.js";

class Highlight {
    constructor() {
        /**
         *
         * @type {List<HighlightDefinition>}
         */
        this.elements = new List();
    }

    /**
     * @deprecated
     * @param {number} v
     */
    set r(v) {
        console.warn('deprecated, use .elements instead');

        const first = this.elements.get(0);

        first.color.setRGB(v, first.color.g, first.color.b);
    }

    /**
     * @deprecated
     * @returns {number}
     */
    get r() {
        console.warn('deprecated, use .elements instead');

        const first = this.elements.get(0);
        const color = first.color;

        return color.r;
    }

    /**
     * @deprecated
     * @param {number} v
     */
    set g(v) {
        console.warn('deprecated, use .elements instead');

        const first = this.elements.get(0);

        first.color.setRGB(first.color.r, v, first.color.b);
    }

    /**
     * @deprecated
     * @returns {number}
     */
    get g() {
        console.warn('deprecated, use .elements instead');

        const first = this.elements.get(0);
        const color = first.color;

        return color.g;
    }

    /**
     * @deprecated
     * @param {number} v
     */
    set b(v) {
        console.warn('deprecated, use .elements instead');

        const first = this.elements.get(0);

        first.color.setRGB(first.color.r, first.color.g, v);
    }

    /**
     * @deprecated
     * @returns {number}
     */
    get b() {
        console.warn('deprecated, use .elements instead');

        const first = this.elements.get(0);
        const color = first.color;

        return color.b;
    }

    /**
     * @deprecated
     * @param {number} v
     */
    set a(v) {
        console.warn('deprecated, use .elements instead');

        const first = this.elements.get(0);

        first.opacity = v;
    }

    /**
     * @deprecated
     * @returns {number}
     */
    get a() {
        console.warn('deprecated, use .elements instead');

        const first = this.elements.get(0);
        return first.opacity;
    }

    /**
     *
     * @returns {HighlightDefinition}
     */
    createElement() {
        const el = new HighlightDefinition();

        this.elements.add(el);

        return el;
    }

    toJSON() {
        return {
            elements: this.elements.toJSON()
        };
    }

    fromJSON(json) {
        this.elements.fromJSON(json.elemenets, HighlightDefinition);
    }

    /**
     *
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     */
    static fromOne(r, g, b, a = 1) {
        const result = new Highlight();

        const el = result.createElement();

        el.color.setRGB(r, g, b);
        el.opacity = a;

        return result;
    }

    /**
     *
     * @param json
     * @returns {Highlight}
     */
    static fromJSON(json) {
        const r = new Highlight();

        r.fromJSON(json);

        return r;
    }
}

Highlight.typeName = "Highlight";

export default Highlight;

