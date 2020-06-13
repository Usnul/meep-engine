import { max2, min2 } from "../../../core/math/MathUtils.js";
import { assert } from "../../../core/assert.js";
import { CellFilter } from "../CellFilter.js";

/**
 * Based on FXAA algorithm by NVidia
 */
export class CellFilterFXAA extends CellFilter {
    constructor() {
        super();

        /**
         *
         * @type {CellFilter}
         */
        this.source = null;

        /**
         * 0.125 leaves less aliasing, but is softer (default!!!)
         * 0.25 leaves more aliasing, and is sharper
         * @type {number}
         */
        this.edge_threshold = 0.25;

        /**
         *  0.06 - faster but more aliasing in darks
         *  0.05 - default
         *  0.04 - slower and less aliasing in darks
         * @type {number}
         */
        this.console_edge_threshold_min = 0.05;

        /**
         *  8.0 is sharper (default!!!)
         *  4.0 is softer
         *  2.0 is really soft (good only for vector graphics inputs)
         * @type {number}
         */
        this.console_edge_sharpness = 2;
    }

    /**
     *
     * @param {CellFilter} source
     * @returns {CellFilterFXAA}
     */
    static from(source) {

        assert.defined(source, 'source');
        assert.equal(source.isCellFilter, true, 'source.isCellFilter');

        const r = new CellFilterFXAA();

        r.source = source;

        return r;
    }

    initialize(grid, seed) {
        super.initialize(grid, seed);

        if (!this.source.initialized) {
            this.source.initialize(grid, seed);
        }
    }

    execute(grid, x, y, rotation) {

        const valueNw = this.source.execute(grid, x - 1, y - 1, rotation);
        const valueNe = this.source.execute(grid, x + 1, y - 1, rotation);
        const valueSw = this.source.execute(grid, x - 1, y + 1, rotation);
        const valueSe = this.source.execute(grid, x + 1, y + 1, rotation);
        const valueM = this.source.execute(grid, x, y, rotation);

        const lumaNW = valueNw;
        const lumaNE = valueNe;
        const lumaSW = valueSw;
        const lumaSE = valueSe;
        const lumaM = valueM;

        const lumaMaxNwSw = max2(lumaNW, lumaSW);
        const lumaMinNwSw = min2(lumaNW, lumaSW);

        const lumaMaxNeSe = max2(lumaNE, lumaSE);
        const lumaMinNeSe = min2(lumaNE, lumaSE);

        const lumaMin = min2(lumaM, min2(lumaMinNeSe, lumaMinNwSw));
        const lumaMax = max2(lumaM, max2(lumaMaxNeSe, lumaMaxNwSw));

        if (lumaMin === lumaMax) {
            //no luma difference across the sampled region
            return valueM;
        }

        const dir_x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
        const dir_y = ((lumaNW + lumaSW) - (lumaNE + lumaSE));

        const dirReduce = max2(
            (lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * this.edge_threshold),
            this.console_edge_threshold_min);

        const rcpDirMin = 1.0 / (min2(Math.abs(dir_x), Math.abs(dir_y)) + dirReduce);

        const dir1_x = min2(this.console_edge_sharpness, max2(-this.console_edge_sharpness, dir_x * rcpDirMin));
        const dir1_y = min2(this.console_edge_sharpness, max2(-this.console_edge_sharpness, dir_y * rcpDirMin));


        const valueN1 = this.source.execute(grid, x + dir1_x * (1 / 3 - 0.5), y + dir1_y * (1 / 3 - 0.5), rotation);
        const valueP1 = this.source.execute(grid, x + dir1_x * (2 / 3 - 0.5), y + dir1_y * (2 / 3 - 0.5), rotation);

        const valueN2 = this.source.execute(grid, x + dir1_x * (-0.5), y + dir1_y * (-0.5), rotation);
        const valueP2 = this.source.execute(grid, x + dir1_x * (0.5), y + dir1_y * (0.5), rotation);


        const valueA = (valueN1 + valueP1) * 0.5;
        const valueB = ((valueN2 + valueP2) * 0.25) + (valueA * 0.5);

        if (valueB < lumaMin || valueB > lumaMax) {
            return valueA;
        } else {
            return valueB;
        }
    }
}
