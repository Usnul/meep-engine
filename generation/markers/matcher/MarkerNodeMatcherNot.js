import { MarkerNodeMatcher } from "./MarkerNodeMatcher.js";
import { assert } from "../../../core/assert.js";

export class MarkerNodeMatcherNot extends MarkerNodeMatcher {
    constructor() {
        super();

        /**
         *
         * @type {MarkerNodeMatcher}
         */
        this.source = null;
    }

    /**
     *
     * @param {MarkerNodeMatcher} source
     * @return {MarkerNodeMatcherNot}
     */
    static from(source) {
        assert.equal(source.isMarkerNodeMatcher, true);

        const r = new MarkerNodeMatcherNot();

        r.source = source;

        return r;
    }

    match(node) {
        return !this.source.match(node);
    }
}
