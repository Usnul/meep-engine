import { MarkerNodeMatcherBinary } from "./MarkerNodeMatcherBinary.js";
import { assert } from "../../../core/assert.js";

export class MarkerNodeMatcherAnd extends MarkerNodeMatcherBinary {

    /**
     *
     * @param {MarkerNodeMatcher} left
     * @param {MarkerNodeMatcher} right
     * @returns {MarkerNodeMatcherAnd}
     */
    static from(left, right) {
        assert.ok(left.isMarkerNodeMatcher, 'left.isMarkerNodeMatcher !== true');
        assert.ok(right.isMarkerNodeMatcher, 'right.isMarkerNodeMatcher !== true');

        const r = new MarkerNodeMatcherAnd();

        r.left = left;
        r.right = right;

        return r;
    }

    match(node) {
        return this.left.match(node) && this.right.match(node);
    }
}
