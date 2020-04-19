import { ObjectPoolFactory } from "../../../core/ObjectPoolFactory.js";
import { noop } from "../../../core/function/Functions.js";

export class IKProblem {
    constructor() {
        /**
         *
         * @type {IKConstraint}
         */
        this.constraint = null;
        /**
         *
         * @type {Skeleton}
         */
        this.skeleton = null;
        /**
         *
         * @type {Terrain}
         */
        this.terrain = null;
    }
}

/**
 *
 * @type {ObjectPoolFactory<IKProblem>}
 */
IKProblem.pool = new ObjectPoolFactory(() => {
    return new IKProblem();
}, noop, noop);
