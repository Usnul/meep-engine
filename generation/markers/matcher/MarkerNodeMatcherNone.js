import { MarkerNodeMatcher } from "./MarkerNodeMatcher.js";

export class MarkerNodeMatcherNone extends MarkerNodeMatcher {
    match(node) {
        return false;
    }
}

/**
 * @readonly
 * @type {MarkerNodeMatcherNone}
 */
MarkerNodeMatcherNone.INSTANCE = new MarkerNodeMatcherNone();
