import { MarkerNodeMatcher } from "./MarkerNodeMatcher.js";

export class MarkerNodeMatcherBinary extends MarkerNodeMatcher {
    constructor() {
        super();

        /**
         *
         * @type {MarkerNodeMatcher}
         */
        this.left = null;

        /**
         *
         * @type {MarkerNodeMatcher}
         */
        this.right = null;
    }
}
