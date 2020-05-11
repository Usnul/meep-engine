export class GridCellPlacementRule {
    constructor() {
        /**
         *
         * @type {GridCellMatcher}
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
