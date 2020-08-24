import { CellMatcher } from "../../../rules/CellMatcher.js";
import AABB2 from "../../../../core/geom/AABB2.js";

export class CellMatcherWithinAABB extends CellMatcher {

    constructor() {
        super();

        this.area = new AABB2();
    }

    /**
     *
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @returns {CellMatcherWithinAABB}
     */
    static from(x0, y0, x1, y1) {
        const r = new CellMatcherWithinAABB();

        r.area.set(x0, y0, x1, y1);

        return r;
    }

    match(grid, x, y, rotation) {

        return this.area.containsPoint(x, y);

    }
}
