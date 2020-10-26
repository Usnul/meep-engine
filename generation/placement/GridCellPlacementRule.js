import { assert } from "../../core/assert.js";
import Vector2 from "../../core/geom/Vector2.js";
import { CellFilterLiteralFloat } from "../filtering/numeric/CellFilterLiteralFloat.js";

export class GridCellPlacementRule {
    constructor() {
        /**
         *
         * @type {CellMatcher}
         */
        this.pattern = null;

        /**
         *
         * @type {CellFilter}
         */
        this.probability = CellFilterLiteralFloat.from(1);

        /**
         *
         * @type {Vector2}
         */
        this.positionOffset = new Vector2();


        /**
         *
         * @type {GridCellAction[]}
         */
        this.actions = [];

        /**
         *
         * @type {boolean}
         */
        this.allowRotation = true;
    }

    /**
     *
     * @param {CellMatcher} matcher
     * @param {GridCellAction[]} actions
     * @param {number|CellFilter} [probability]
     * @param {Vector2} [offset]
     * @returns {GridCellPlacementRule}
     */
    static from({ matcher, actions, probability, offset = Vector2.zero }) {

        assert.defined(matcher);
        assert.defined(actions);

        assert.isArray(actions);

        const r = new GridCellPlacementRule();

        r.pattern = matcher;
        r.actions = actions;

        if (probability !== undefined) {
            assert.equal(probability.isCellFilter, true, 'probability.isCellFilter !== true');
            r.probability = probability;
        }

        r.positionOffset.copy(offset);

        return r;
    }

    /**
     *
     * @param {GridData} grid
     * @param {number} seed
     */
    initialize(grid, seed) {
        const actions = this.actions;
        const n = actions.length;

        for (let i = 0; i < n; i++) {
            const action = actions[i];

            action.initialize(grid, seed);
        }

        this.pattern.initialize(grid, seed);

        if (!this.probability.initialized) {
            this.probability.initialize(grid, seed);
        }
    }

    /**
     * Write placement tags into the grid at a given position, the tag pattern will be rotated as specified
     * @param {GridData} grid
     * @param {number} x
     * @param {number} y
     * @param {number} rotation in Radians
     */
    execute(grid, x, y, rotation) {
        const actions = this.actions;
        const n = actions.length;

        const sin = Math.sin(rotation);
        const cos = Math.cos(rotation);

        const local_x = this.positionOffset.x;
        const local_y = this.positionOffset.y;

        const rotated_local_x = local_x * cos - local_y * sin
        const rotated_local_y = local_x * sin + local_y * cos;

        for (let i = 0; i < n; i++) {
            const action = actions[i];

            action.execute(grid, x + rotated_local_x, y + rotated_local_y, rotation);
        }

    }
}
