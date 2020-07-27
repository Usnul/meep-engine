import { MarkerNodeTransformer } from "./MarkerNodeTransformer.js";
import { seededRandom } from "../../../core/math/MathUtils.js";

export class MarkerNodeTransformRotateRandom extends MarkerNodeTransformer {

    constructor() {
        super();

        this.seed = 0;

        this.random = seededRandom(0);
    }

    static from(seed = 0) {
        const r = new MarkerNodeTransformRotateRandom();

        r.seed = seed;

        return r;
    }

    initialize(grid, seed) {
        this.random.setCurrentSeed(seed + this.seed);
    }

    transform(node, grid) {
        const result = node.clone();

        result.transform.rotation.setRandom(this.random);

        return result;
    }
}
