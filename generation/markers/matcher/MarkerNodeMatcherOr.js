import { MarkerNodeMatcherBinary } from "./MarkerNodeMatcherBinary.js";

export class MarkerNodeMatcherOr extends MarkerNodeMatcherBinary {

    match(node) {
        return this.left.match(node) || this.right.match(node);
    }
    
}
