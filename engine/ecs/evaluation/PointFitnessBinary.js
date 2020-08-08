import { PointFitnessFunction } from "./PointFitnessFunction.js";

export class PointFitnessBinary extends PointFitnessFunction {
    constructor() {
        super();

        /**
         *
         * @type {PointFitnessFunction}
         */
        this.left = null;
        /**
         *
         * @type {PointFitnessFunction}
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
        throw new Error(`Not implemented`);
    }

    evaluate(ecd, x, y, z) {
        const left = this.left.evaluate(ecd, x, y, z);
        const right = this.right.evaluate(ecd, x, y, z);


        return this.operation(left, right);
    }
}
