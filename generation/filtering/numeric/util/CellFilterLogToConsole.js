import { CellFilterUnaryOperation } from "../../core/CellFilterUnaryOperation.js";
import { assert } from "../../../core/assert.js";

export class CellFilterLogToConsole extends CellFilterUnaryOperation {

    /**
     * @param {CellFilter} source
     * @returns {CellFilterLogToConsole}
     */
    static from(source) {
        assert.equal(source.isCellFilter, true, "source.isCellFilter !== true");

        const r = new CellFilterLogToConsole();

        r.source = source;

        return r
    }

    execute(grid, x, y, rotation) {
        const v = this.source.execute(grid, x, y, rotation);

        console.log(`x: ${x}, y: ${y}, r: ${rotation}, value: ${v}`);

        return v;
    }
}
