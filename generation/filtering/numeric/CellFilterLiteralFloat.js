import { CellFilter } from "../CellFilter.js";
import { assert } from "../../../core/assert.js";

export class CellFilterLiteralFloat extends CellFilter {
    constructor() {
        super();

        /**
         *
         * @type {number}
         */
        this.value = 1;
    }

    /**
     *
     * @param {number} value
     * @returns {CellFilterLiteralFloat}
     */
    static from(value) {
        assert.isNumber(value, 'value');

        const r = new CellFilterLiteralFloat();

        r.value = value;

        return r;
    }

    execute(grid, x, y, rotation) {
        return this.value;
    }
}

/**
 * @readonly
 * @type {CellFilterLiteralFloat}
 */
CellFilterLiteralFloat.ONE = CellFilterLiteralFloat.from(1);
