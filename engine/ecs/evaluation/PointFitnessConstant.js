import { PointFitnessFunction } from "./PointFitnessFunction.js";
import { assert } from "../../../core/assert.js";

export class PointFitnessConstant extends PointFitnessFunction {
    constructor() {
        super();

        /**
         *
         * @type {number}
         */
        this.value = 0;
    }

    static from(v) {
        assert.isNumber(v, 'v');

        const r = new PointFitnessConstant();

        r.value = v;

        return r;
    }

    evaluate(ecd, x, y, z) {
        return this.value;
    }
}


PointFitnessConstant.prototype.type = "PointFitnessConstant";
