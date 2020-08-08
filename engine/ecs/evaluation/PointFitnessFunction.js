export class PointFitnessFunction {

    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {number}
     */
    evaluate(ecd, x, y, z) {
        throw new Error(`Not implemented`);
    }
}

/**
 *
 * @type {boolean}
 */
PointFitnessFunction.prototype.isPointFitnessFunction = true;
