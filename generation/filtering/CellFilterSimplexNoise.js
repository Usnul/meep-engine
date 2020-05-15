import { CellFilter } from "./CellFilter.js";
import SimplexNoise from 'simplex-noise';
import { seededRandom } from "../../core/math/MathUtils.js";

export class CellFilterSimplexNoise extends CellFilter {
    constructor() {
        super();

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

    /**
     *
     * @param {number} scale_x
     * @param {number} scale_y
     * @returns {CellFilterSimplexNoise}
     */
    static from(scale_x, scale_y) {
        const r = new CellFilterSimplexNoise();

        r.scale_x = scale_x;
        r.scale_y = scale_y;

        return r;
    }

    initialize(seed) {
        this.random.setCurrentSeed(seed);

        const noise = new SimplexNoise(this.random);

        this.noise = noise;

        super.initialize(seed);
    }

    execute(grid, x, y, rotation) {
        const noiseValue = this.noise.noise2D(x / this.scale_x, y / this.scale_y);

        //noise function returns values in range [-1,1] we need to scale that to [0,1] range
        const normalizedValue = (noiseValue + 1) / 2;

        return normalizedValue;
    }
}
