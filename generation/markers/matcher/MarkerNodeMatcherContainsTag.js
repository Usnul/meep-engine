import { MarkerNodeMatcher } from "./MarkerNodeMatcher.js";
import { assert } from "../../../core/assert.js";

export class MarkerNodeMatcherContainsTag extends MarkerNodeMatcher {
    constructor() {
        super();

        /**
         *
         * @type {String}
         */
        this.tag = null;
    }

    static from(tag) {
        assert.typeOf(tag, 'string', 'tag');

        const r = new MarkerNodeMatcherContainsTag();

        r.tag = tag;

        return r;
    }

    match(node) {
        return node.tags.indexOf(this.tag) !== -1;
    }
}
