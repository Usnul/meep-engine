import { CellFilterUnaryOperation } from "../core/CellFilterUnaryOperation.js";
import { Sampler2D } from "../../../engine/graphics/texture/sampler/Sampler2D.js";
import { assert } from "../../../core/assert.js";

export class CellFilterCache extends CellFilterUnaryOperation {

    constructor() {
        super();

        /**
         *
         * @type {Sampler2D}
         * @private
         */
        this.__cache = Sampler2D.float32(1, 1, 1);

        /**
         *
         * @type {number}
         */
        this.scale = 1;
    }

    /**
     *
     * @param {CellFilter} source
     * @param {number} [scale]
     * @returns {CellFilterCache}
     */
    static from(source, scale = 1) {
        assert.equal(source.isCellFilter, true, 'source.isCellFilter !== true');

        const r = new CellFilterCache();

        r.source = source;

        return r;
    }

    initialize(grid, seed) {
        super.initialize(grid, seed);

        const g_w = grid.width;
        const g_h = grid.height;

        const target_w = this.scale * g_w;
        const target_h = this.scale * g_h;

        this.__cache.resize(target_w, target_h);

        const scale_1 = 1 / this.scale;

        console.time('Cache filter build');

        for (let y = 0; y < target_h; y++) {
            const g_y = y * scale_1;

            for (let x = 0; x < target_w; x++) {

                const g_x = x * scale_1;

                const sampleValue = this.source.execute(grid, g_x, g_y, 0);

                this.__cache.writeChannel(x, y, 0, sampleValue);
            }
        }

        console.timeEnd('Cache filter build');
    }

    execute(grid, x, y, rotation) {
        return this.__cache.sampleChannelBilinear(x, y, 0);
    }
}
