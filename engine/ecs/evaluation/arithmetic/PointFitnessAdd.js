import { PointFitnessBinary } from "../PointFitnessBinary.js";
import { assert } from "../../../../core/assert.js";

export class PointFitnessAdd extends PointFitnessBinary {
    /**
     * @param {PointFitnessFunction} left
     * @param {PointFitnessFunction} right
     * @returns {PointFitnessAdd}
     */
    static from(left, right) {
        assert.equal(left.isPointFitnessFunction, true, 'left.isPointFitnessFunction !== true');
        assert.equal(right.isPointFitnessFunction, true, 'right.isPointFitnessFunction !== true');

        const r = new PointFitnessAdd();

        r.left = left;
        r.right = right;

        return r;
    }

    operation(left, right) {
        return left + right;
    }
}

PointFitnessAdd.prototype.type = "PointFitnessAdd";
