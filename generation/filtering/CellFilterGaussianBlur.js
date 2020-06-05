import { CellFilter } from "./CellFilter.js";

/**
 *
 * @param {number} sigma
 * @param {number} v
 * @returns {number}
 */
function gaussian(sigma, v) {
    return Math.exp(-(v * v) / (2 * sigma * sigma));
}

export class CellFilterGaussianBlur extends CellFilter {
    constructor() {
        super();

        this.samples_x = 5;
        this.samples_y = 5;

        this.sigma_x = 10;
        this.sigma_y = 10;

        /**
         *
         * @type {CellFilter}
         */
        this.source = null;

        this.size_x = 1;
        this.size_y = 1;
    }

    initialize(grid, seed) {
        if (!this.source.initialized) {
            this.source.initialize(grid, seed);
        }
    }


    /**
     *
     * @param {CellFilter} source
     * @param {number} x
     * @param {number} y
     * @param {number} quality
     * @returns {CellFilterGaussianBlur}
     */
    static from(source, x, y, quality = 5) {
        const r = new CellFilterGaussianBlur();

        r.source = source;

        r.samples_x = quality * x;
        r.samples_y = quality * y;

        r.size_x = x;
        r.size_y = y;

        return r;
    }

    execute(grid, x, y, rotation) {
        const samplesX = this.samples_x;
        const samplesY = this.samples_y;

        const half_samples_x = (samplesX / 2);
        const half_samples_y = (samplesY / 2);

        const sizeX = this.size_x;
        const sizeY = this.size_y;

        let sum = 0;
        let powerTotal = 0;

        for (let iy = 0; iy < samplesY; iy++) {
            const local_y = iy - half_samples_y;

            const fy = gaussian(this.sigma_y, local_y);

            const ny = local_y / samplesY;

            const offset_y = sizeY * ny;

            for (let ix = 0; ix < samplesX; ix++) {

                const local_x = ix - half_samples_x;

                const fx = gaussian(this.sigma_x, local_x);

                const nx = local_x / samplesX;

                const offset_x = sizeX * nx;

                const power = fx * fy;

                powerTotal += power;

                const sourceValue = this.source.execute(grid, x + offset_x, y + offset_y, 0);

                sum += sourceValue * power;

            }
        }

        const result = sum / powerTotal;

        return result;
    }
}
