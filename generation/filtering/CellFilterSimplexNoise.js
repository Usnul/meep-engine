import { CellFilter } from "./CellFilter.js";
import SimplexNoise from 'simplex-noise';
import { seededRandom } from "../../core/math/MathUtils.js";

export class CellFilterSimplexNoise extends CellFilter {
    constructor() {
        super();

        this.seed = 0;

        /**
         * @private
         * @type {SimplexNoise}
         */
        this.noise = null;

        /**
         * @private
         * @type {random}
         */
        this.random = seededRandom(0);

        this.scale_x = 1;
        this.scale_y = 1;
    }

    initialize() {
        this.random.setCurrentSeed(this.seed);

        const noise = new SimplexNoise(this.random);

        this.noise = noise;
    }

    execute(grid, x, y, rotation) {
        const noiseValue = this.noise.noise2D(x * this.scale_x, y * this.scale_y);

        //noise function returns values in range [-1,1] we need to scale that to [0,1] range
        const normalizedValue = (noiseValue + 1) / 2;

        return normalizedValue;
    }
}
