import { CellFilterUnaryOperation } from "./core/CellFilterUnaryOperation.js";
import { Sampler2D } from "../../engine/graphics/texture/sampler/Sampler2D.js";
import { assert } from "../../core/assert.js";

export class CellFilterCache extends CellFilterUnaryOperation {

    constructor() {
        super();

        /**
         *
         * @type {Sampler2D}
         * @private
         */
        this.__cache = Sampler2D.float32(1, 1, 1);
    }

    /**
     *
     * @param {CellFilter} source
     * @returns {CellFilterCache}
     */
    static from(source) {
        assert.equal(source.isCellFilter, true, 'source.isCellFilter !== true');

        const r = new CellFilterCache();

        r.source = source;

        return r;
    }

    initialize(grid, seed) {
        super.initialize(grid, seed);

        const width = grid.width;
        const height = grid.height;

        this.__cache.resize(width, height);

        console.time('Cache filter build');

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const sampleValue = this.source.execute(grid, x, y, 0);

                this.__cache.writeChannel(x, y, 0, sampleValue);
            }
        }

        console.timeEnd('Cache filter build');
    }

    execute(grid, x, y, rotation) {
        return this.__cache.sampleChannelBilinear(x, y, 0);
    }
}
