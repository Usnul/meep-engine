import { MarkerNodeMatcher } from "./MarkerNodeMatcher.js";

export class MarkerNodeMatcherAny extends MarkerNodeMatcher {
    match(node) {
        return true;
    }
}

/**
 * @readonly
 * @type {MarkerNodeMatcherAny}
 */
MarkerNodeMatcherAny.INSTANCE = new MarkerNodeMatcherAny();
