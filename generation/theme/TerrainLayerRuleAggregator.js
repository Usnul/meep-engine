import { assert } from "../../core/assert.js";

export class TerrainLayerRuleAggregator {
    /**
     *
     * @param {number} layerCount
     */
    constructor(layerCount) {

        assert.typeOf(layerCount, 'number', 'layerCount');
        /**
         *
         * @type {number}
         */
        this.layerCount = layerCount;
        this.powers = new Float32Array(layerCount);
    }

    /**
     *
     * @param {number} layer
     * @param {number} power
     */
    add(layer, power) {
        this.powers[layer] += power;
    }

    normalize(m) {
        let magnitude = 0;

        const layerCount = this.layerCount;

        const powers = this.powers;

        for (let i = 0; i < layerCount; i++) {
            const power = powers[i];
            magnitude += power * power;
        }

        const d = Math.sqrt(magnitude);

        const multiplier = m / d;

        for (let i = 0; i < layerCount; i++) {
            const power = powers[i];

            powers[i] = power * multiplier;
        }

    }

    clear() {
        this.powers.fill(0);
    }
}
