import { CellFilter } from "./CellFilter.js";
import { assert } from "../../core/assert.js";

export class CellFilterConstant extends CellFilter {
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
     * @returns {CellFilterConstant}
     */
    static from(value) {
        assert.isNumber(value, 'value');

        const r = new CellFilterConstant();

        r.value = value;

        return r;
    }

    execute(grid, x, y, rotation) {
        return this.value;
    }
}
