import { NumericInterval } from "../../core/math/interval/NumericInterval.js";

export class TerrainLayerRule {
    constructor() {
        /**
         *
         * @type {GridCellRule}
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

    /**
     *
     * @param {GridCellRule} rule
     * @param {number} layer
     * @param {NumericInterval} intensity
     * @returns {TerrainLayerRule}
     */
    static from(rule, layer, intensity) {
        const r = new TerrainLayerRule();

        r.rule = rule;
        r.layer = layer;

        if (intensity !== undefined) {
            r.intensity.copy(intensity);
        }

        return r;
    }
}
