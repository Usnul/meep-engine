import { PointFitnessFunction } from "../PointFitnessFunction.js";
import { assert } from "../../../../core/assert.js";
import { gaussian } from "../../../../core/math/MathUtils.js";

export class PointFitnessGaussianBlur extends PointFitnessFunction {
    constructor() {
        super();

        this.samples_x = 5;
        this.samples_y = 5;
        this.samples_z = 5;

        this.sigma_x = 10;
        this.sigma_y = 10;
        this.sigma_z = 10;


        this.size_x = 1;
        this.size_y = 1;
        this.size_z = 1;

        /**
         *
         * @type {PointFitnessFunction}
         */
        this.source = null;
    }

    /**
     *
     * @param {PointFitnessFunction} source
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} [quality]
     * @returns {PointFitnessGaussianBlur}
     */
    static from(source, x, y, z, quality = 5) {

        assert.isNumber(x, 'x');
        assert.isNumber(y, 'y');
        assert.isNumber(z, 'z');
        assert.isNumber(quality, 'quality');

        assert.equal(source.isPointFitnessFunction, true, 'source.isPointFitnessFunction !== true');

        const r = new PointFitnessGaussianBlur();

        r.source = source;

        r.samples_x = x * quality;
        r.samples_y = y * quality;
        r.samples_z = z * quality;

        r.size_x = x;
        r.size_y = y;
        r.size_z = z;

        return r;
    }

    evaluate(ecd, x, y, z) {
        const samplesX = this.samples_x;
        const samplesY = this.samples_y;
        const samplesZ = this.samples_z;

        const half_samples_x = (samplesX / 2);
        const half_samples_y = (samplesY / 2);
        const half_samples_z = (samplesZ / 2);

        const sizeX = this.size_x;
        const sizeY = this.size_y;
        const sizeZ = this.size_z;

        let sum = 0;
        let powerTotal = 0;

        for (let iz = 0; iz < samplesZ; iz++) {

            const local_z = iz - half_samples_z;

            const fz = gaussian(this.sigma_z, local_z);

            const nz = local_z / samplesZ;

            const offset_z = sizeZ * nz;

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

                    const power = fx * fy * fz;

                    powerTotal += power;

                    const sourceValue = this.source.evaluate(ecd, x + offset_x, y + offset_y, z + offset_z);

                    sum += sourceValue * power;

                }
            }
        }

        const result = sum / powerTotal;

        return result;
    }
}

PointFitnessGaussianBlur.prototype.type = "PointFitnessGaussianBlur";
