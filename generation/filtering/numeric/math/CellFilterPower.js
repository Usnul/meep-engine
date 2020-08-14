import { CellFilterBinaryOperation } from "../../core/CellFilterBinaryOperation.js";
import { assert } from "../../../../core/assert.js";

export class CellFilterPower extends CellFilterBinaryOperation {


    /**
     *
     * @param {CellFilter} value
     * @param {CellFilter} power
     * @returns {CellFilterPower}
     */
    static from(value, power) {
        assert.equal(value.isCellFilter, true, "value.isCellFilter !== true");
        assert.equal(power.isCellFilter, true, "power.isCellFilter !== true");

        const r = new CellFilterPower();

        r.left = value;
        r.right = power;

        return r;
    }

    execute(grid, x, y, rotation) {
        const value = this.left.execute(grid, x, y, rotation);
        const power = this.right.execute(grid, x, y, rotation);

        return Math.pow(value, power);
    }
}
