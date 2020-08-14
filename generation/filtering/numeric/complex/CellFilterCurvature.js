import { CellFilter } from "../../CellFilter.js";
import { assert } from "../../../../core/assert.js";


/*

Based on glsl code (source: http://madebyevan.com/shaders/curvature/):

  vec3 n = normalize(normal);

  vec3 dx = dFdx(n);
  vec3 dy = dFdy(n);
  vec3 xneg = n - dx;
  vec3 xpos = n + dx;
  vec3 yneg = n - dy;
  vec3 ypos = n + dy;
  float depth = length(vertex);
  float curvature = (cross(xneg, xpos).y - cross(yneg, ypos).x) * 4.0 / depth;
 */

const yneg = [];
const ypos = [];
const xneg = [];
const xpos = [];

/**
 *
 * @param {GridData} grid
 * @param {number[]} result
 * @param {CellFilter} surface
 * @param {number} x
 * @param {number} y
 */
function computeNormal(grid, result, surface, x, y) {


    //read surrounding points
    const top = surface.execute(grid, x, y - 1, 0);

    const left = surface.execute(grid, x - 1, y, 0);
    const right = surface.execute(grid, x + 1, y, 0);

    const bottom = surface.execute(grid, x, y + 1, 0);

    // compute gradients
    const dX = (right) - (left);
    const dY = (bottom) - (top);

    //normalize vector
    const magnitude = Math.sqrt(dX * dX + dY * dY + 4);

    const _x = dX / magnitude;
    const _y = dY / magnitude;
    const _z = 2 / magnitude;

    result[0] = _x;
    result[1] = _y;
    result[2] = _z;
}

export class CellFilterCurvature extends CellFilter {
    constructor() {
        super();

        /**
         * Surface for which the curvature is to be computed
         * @type {CellFilter}
         */
        this.surface = null;
    }

    /**
     *
     * @param {CellFilter} surface
     * @return {CellFilterCurvature}
     */
    static from(surface) {

        assert.equal(surface.isCellFilter, true, 'surface.isCellFilter !== true');

        const r = new CellFilterCurvature();

        r.surface = surface;

        return r;
    }

    initialize(grid, seed) {
        if (!this.surface.initialized) {
            this.surface.initialize(grid, seed);
        }

        super.initialize(grid, seed);
    }

    /**
     *
     * @param grid
     * @param x
     * @param y
     * @param rotation
     * @return {number}
     */
    execute(grid, x, y, rotation) {

        const surface = this.surface;

        //compute normals up, down, left, right
        computeNormal(grid, yneg, surface, x, y - 1);
        computeNormal(grid, xneg, surface, x - 1, y);
        computeNormal(grid, xpos, surface, x + 1, y);
        computeNormal(grid, ypos, surface, x, y + 1);


        // compute curvature value
        const cross_xneg_xpos_y = xneg[2] * xpos[0] - xneg[0] * xpos[2];
        const cross_yneg_ypos_x = yneg[1] * ypos[2] - yneg[2] * ypos[1];

        const curvature = (cross_xneg_xpos_y - cross_yneg_ypos_x);

        return curvature;
    }
}
