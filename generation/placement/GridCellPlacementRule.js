import { assert } from "../../core/assert.js";

export class GridCellPlacementRule {
    constructor() {
        /**
         *
         * @type {CellMatcher}
         */
        this.pattern = null;

        /**
         *
         * @type {number}
         */
        this.probability = 1;


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
     * @param {number} [probability]
     */
    static from(matcher, actions, probability = 1) {

        assert.defined(matcher);
        assert.defined(actions);
        assert.isNumber(probability);

        const r = new GridCellPlacementRule();

        r.pattern = matcher;
        r.actions = actions;
        r.probability = probability;

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

        for (let i = 0; i < n; i++) {
            const action = actions[i];

            action.execute(grid, x, y, rotation);
        }

    }
}
