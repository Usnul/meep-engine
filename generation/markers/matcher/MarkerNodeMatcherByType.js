import { MarkerNodeMatcher } from "./MarkerNodeMatcher.js";
import { assert } from "../../../core/assert.js";

export class MarkerNodeMatcherByType extends MarkerNodeMatcher {
    constructor() {
        super();

        /**
         *
         * @type {String}
         */
        this.type = null;
    }

    /**
     *
     * @param {String} type
     * @returns {MarkerNodeMatcherByType}
     */
    static from(type) {
        assert.typeOf(type, 'string', 'type');

        const r = new MarkerNodeMatcherByType();

        r.type = type;

        return r;
    }

    match(node) {
        assert.defined(node, 'node');
        assert.ok(node.isMarkerNode, 'node.isMarkerNode !== true');

        return node.type === this.type;
    }
}
