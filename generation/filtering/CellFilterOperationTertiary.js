import { CellFilter } from "./CellFilter.js";

export class CellFilterOperationTertiary extends CellFilter {
    constructor() {
        super();

        /**
         *
         * @type {CellFilter}
         */
        this.a = null;
        /**
         *
         * @type {CellFilter}
         */
        this.b = null;
        /**
         *
         * @type {CellFilter}
         */
        this.c = null;

    }

    /**
     *
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @returns {number}
     */
    operation(a, b, c) {

    }

    initialize(seed) {
        if (this.initialized) {
            return;
        }

        super.initialize(seed);

        if (!this.a.initialized) {
            this.a.initialize(seed);
        }

        if (!this.b.initialized) {
            this.b.initialize(seed);
        }

        if (!this.c.initialized) {
            this.c.initialize(seed);
        }
    }

    execute(grid, x, y, rotation) {
        const a = this.a.execute(grid, x, y, rotation);
        const b = this.b.execute(grid, x, y, rotation);
        const c = this.c.execute(grid, x, y, rotation);

        return this.operation(a, b, c);
    }
}
