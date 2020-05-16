import { MarkerNodeMatcherBinary } from "./MarkerNodeMatcherBinary.js";

export class MarkerNodeMatcherAnd extends MarkerNodeMatcherBinary {
    match(node) {
        this.left.match(node) && this.right.match(node);
    }
}
