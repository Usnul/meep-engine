import { GridCellAction } from "../GridCellAction.js";
import Vector2 from "../../../../core/geom/Vector2.js";
import { assert } from "../../../../core/assert.js";

export class GridCellDisplacedAction extends GridCellAction {
    constructor() {
        super();

        this.offset = new Vector2();

        /**
         *
         * @type {GridCellAction}
         */
        this.action = null;
    }

    /**
     *
     * @param {GridCellAction} source
     * @param {number} x
     * @param {number} y
     * @returns {GridCellDisplacedAction}
     */
    static from(source, x,y){

        assert.equal(source.isGridCellAction, true,'source.isGridCellAction !== true');

        const r = new GridCellDisplacedAction();

        r.offset.set(x,y);
        r.action = source;

        return r;
    }

    initialize(data, seed) {

        this.action.initialize(data, seed);
    }

    execute(data, x, y, rotation) {

        const sin = Math.sin(rotation);
        const cos = Math.cos(rotation);

        const local_x = this.offset.x;
        const local_y = this.offset.y;

        const rotated_local_x = local_x * cos - local_y * sin
        const rotated_local_y = local_x * sin + local_y * cos;

        this.action.execute(data, x + rotated_local_x, y + rotated_local_y, rotation);
    }
}
