import { CellFilter } from "../CellFilter.js";
import Vector3, { v3_angleBetween } from "../../../core/geom/Vector3.js";
import { assert } from "../../../core/assert.js";

/**
 * Builds surface normal of another filter, and then computes the angle to a fixed 3d vector
 */
export class CellFilterAngleToNormal extends CellFilter {
    constructor() {
        super();

        /**
         * Reference vector to which the angle is computes
         * @type {Vector3}
         */
        this.reference = new Vector3(0, 1, 0);

        /**
         * Is treated as a 3d surface
         * @type {CellFilter}
         */
        this.surface = null;
    }

    /**
     *
     * @param {CellFilter} surface
     * @param {Vector3} [reference=Vector3.up]
     */
    static from(surface, reference = Vector3.up) {
        assert.equal(surface.isCellFilter, true, 'surface.isCellFilter !== true');

        const r = new CellFilterAngleToNormal();

        r.surface = surface;
        r.reference.copy(reference);

        return r;
    }

    initialize(grid, seed) {
        if (!this.surface.initialized) {
            this.surface.initialize(grid, seed);
        }

        super.initialize(grid, seed);
    }

    execute(grid, x, y, rotation) {
        const filter = this.surface;

        //read surrounding points
        const topLeft = filter.execute(grid, x - 1, y - 1, 0);
        const top = filter.execute(grid, x, y - 1, 0);
        const topRight = filter.execute(grid, x + 1, y - 1, 0);

        const left = filter.execute(grid, x - 1, y, 0);
        const right = filter.execute(grid, x + 1, y, 0);

        const bottomLeft = filter.execute(grid, x - 1, y + 1, 0);
        const bottom = filter.execute(grid, x, y + 1, 0);
        const bottomRight = filter.execute(grid, x + 1, y + 1, 0);

        // compute gradients
        const dX = (topRight + 2.0 * right + bottomRight) - (topLeft + 2.0 * left + bottomLeft);
        const dY = (bottomLeft + 2.0 * bottom + bottomRight) - (topLeft + 2.0 * top + topRight);

        //normalize vector
        const magnitude = Math.sqrt(dX * dX + dY * dY + 0.25);

        const _x = dX / magnitude;
        const _y = dY / magnitude;
        const _z = 0.5 / magnitude;

        return v3_angleBetween(this.reference.x, this.reference.y, this.reference.z, _x, _y, _z);
    }
}
