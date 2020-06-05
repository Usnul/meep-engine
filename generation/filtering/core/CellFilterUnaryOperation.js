export class CellFilterUnaryOperation extends CellFilter {
    constructor() {
        super();

        /**
         *
         * @type {CellFilter}
         */
        this.source = null;
    }

    /**
     *
     * @param {number} v
     * @returns {number}
     */
    operation(v) {
        throw new Error('Not implemented');
    }

    initialize(grid, seed) {
        super.initialize(grid, seed);

        if (!this.source.initialized) {
            this.source.initialize(grid, seed);
        }
    }

    execute(grid, x, y, rotation) {
        const s = this.source.execute(grid, x, y, rotation);

        return this.operation(s);
    }
}
