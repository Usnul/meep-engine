import { CellFilterUnaryOperation } from "../../../core/CellFilterUnaryOperation.js";
import { assert } from "../../../../../core/assert.js";

export class CellFilterCubicFunction extends CellFilterUnaryOperation {
    constructor() {
        super();

        this.p0 = 0;
        this.p1 = 0;
        this.p2 = 0;
        this.p3 = 0;
    }


    /**
     *
     * @param {CellFilter} source
     * @param {number} p0
     * @param {number} p1
     * @param {number} p2
     * @param {number} p3
     * @returns {CellFilterCubicFunction}
     */
    static from(source, p0, p1, p2, p3) {

        assert.equal(source.isCellFilter, true, "source.isCellFilter !== true");
        assert.isNumber(p0, "p0");
        assert.isNumber(p1, "p1");
        assert.isNumber(p2, "p2");
        assert.isNumber(p3, "p3");

        const r = new CellFilterCubicFunction();

        r.source = source;

        r.p0 = p0;
        r.p1 = p1;
        r.p2 = p2;
        r.p3 = p3;

        return r;
    }

    operation(v) {
        const v2 = v * v;
        const v3 = v2 * v;

        return v3 * this.p3 + v2 * this.p2 + v * this.p1 + this.p0;
    }
}
