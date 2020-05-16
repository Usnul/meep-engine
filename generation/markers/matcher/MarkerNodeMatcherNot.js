import { MarkerNodeMatcher } from "./MarkerNodeMatcher.js";

export class MarkerNodeMatcherNot extends MarkerNodeMatcher{
    constructor() {
        super();

        /**
         *
         * @type {MarkerNodeMatcher}
         */
        this.source = null;
    }

    match(node) {
        return !this.source.match(node);
    }
}
