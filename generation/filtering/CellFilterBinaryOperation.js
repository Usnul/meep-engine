import { CellFilter } from "./CellFilter.js";

export class CellFilterBinaryOperation extends CellFilter {
    constructor() {
        super();

        /**
         *
         * @type {CellFilter}
         */
        this.left = null;

        /**
         *
         * @type {CellFilter}
         */
        this.right = null;
    }

    /**
     *
     * @param {number} left
     * @param {number} right
     * @returns {number}
     */
    operation(left, right) {

    }

    execute(grid, x, y, rotation) {
        const left = this.left.execute(grid, x, y, rotation);
        const right = this.right.execute(grid, x, y, rotation);

        return this.operation(left, right);
    }

    initialize(seed) {
        if (this.initialized) {
            return;
        }

        super.initialize(seed);

        if (!this.left.initialized) {
            this.left.initialize(seed);
        }

        if (!this.right.initialized) {
            this.right.initialize(seed);
        }

    }
}
