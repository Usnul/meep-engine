import { CellFilterUnaryOperation } from "../../core/CellFilterUnaryOperation.js";
import Vector2 from "../../../core/geom/Vector2.js";
import { assert } from "../../../core/assert.js";

export class CellFilterDisplaced extends CellFilterUnaryOperation {

    constructor() {
        super();

        this.offset = new Vector2();
    }

    /**
     *
     * @param {CellFilter} source
     * @param {number} x
     * @param {number} y
     * @return {CellFilterDisplaced}
     */
    static from(source, x, y) {
        assert.equal(source.isCellFilter, true, 'source.isCellFilter !== true');

        const r = new CellFilterDisplaced();

        r.source = source;
        r.offset.set(x, y);

        return r;
    }

    execute(grid, x, y, rotation) {

        const sin = Math.sin(rotation);
        const cos = Math.cos(rotation);

        const local_x = this.offset.x;
        const local_y = this.offset.y;

        const rotated_local_x = local_x * cos - local_y * sin
        const rotated_local_y = local_x * sin + local_y * cos;

        return this.source.execute(grid, x + rotated_local_x, y + rotated_local_y, rotation);

    }
}
