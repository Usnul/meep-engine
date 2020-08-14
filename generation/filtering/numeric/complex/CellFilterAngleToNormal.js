import { CellFilter } from "../../CellFilter.js";
import Vector3, { v3_angleBetween } from "../../../../core/geom/Vector3.js";
import { assert } from "../../../../core/assert.js";

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
        this.reference = new Vector3(0, 0, 1);

        /**
         * Is treated as a 3d surface
         * @type {CellFilter}
         */
        this.surface = null;
    }

    /**
     *
     * @param {CellFilter} surface
     * @param {Vector3} [reference=Vector3.forward]
     */
    static from(surface, reference = Vector3.forward) {
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
        const top = filter.execute(grid, x, y - 1, 0);

        const left = filter.execute(grid, x - 1, y, 0);
        const right = filter.execute(grid, x + 1, y, 0);

        const bottom = filter.execute(grid, x, y + 1, 0);

        // compute gradients
        const dX = (right) - (left);
        const dY = (bottom) - (top);

        //normalize vector
        const magnitude = Math.sqrt(dX * dX + dY * dY + 4);

        const _x = dX / magnitude;
        const _y = dY / magnitude;
        const _z = 2 / magnitude;

        const reference = this.reference;

        const angle = v3_angleBetween(reference.x, reference.y, reference.z, _x, _y, _z);

        return angle;
    }
}
