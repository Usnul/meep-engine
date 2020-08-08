import { PointFitnessBinary } from "../PointFitnessBinary.js";
import { assert } from "../../../../core/assert.js";

export class PointFitnessMultiply extends PointFitnessBinary {
    /**
     * @param {PointFitnessFunction} left
     * @param {PointFitnessFunction} right
     * @returns {PointFitnessMultiply}
     */
    static from(left, right) {
        assert.equal(left.isPointFitnessFunction, true, 'left.isPointFitnessFunction !== true');
        assert.equal(right.isPointFitnessFunction, true, 'right.isPointFitnessFunction !== true');

        const r = new PointFitnessMultiply();

        r.left = left;
        r.right = right;

        return r;
    }

    operation(left, right) {
        return left * right;
    }
}


PointFitnessMultiply.prototype.type = "PointFitnessMultiply";
