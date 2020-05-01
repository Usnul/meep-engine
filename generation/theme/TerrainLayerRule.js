import { NumericInterval } from "../../core/math/interval/NumericInterval.js";

export class TerrainLayerRule {
    constructor() {
        /**
         *
         * @type {TagRule}
         */
        this.rule = null;
        this.layer = 0;
        this.intensity = new NumericInterval(1, 1);

        /**
         *
         * @type {number}
         */
        this.blur = 0;
    }
}
