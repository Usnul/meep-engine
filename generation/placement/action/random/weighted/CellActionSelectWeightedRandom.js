import { GridCellAction } from "../../GridCellAction.js";
import { seededRandom } from "../../../../../core/math/MathUtils.js";
import { binarySearchLowIndex } from "../../../../../core/collection/ArrayUtils.js";
import { compareNumbers } from "../../../../../core/primitives/numbers/compareNumbers.js";
import { assert } from "../../../../../core/assert.js";

/**
 *
 * @type {number[]}
 */
const evaluatedWeights = [];

export class CellActionSelectWeightedRandom extends GridCellAction {
    constructor() {
        super();

        /**
         *
         * @type {function}
         * @private
         */
        this.__random = seededRandom(0);

        /**
         *
         * @type {WeightedGridCellAction[]}
         */
        this.options = [];
    }


    /**
     *
     * @param {WeightedGridCellAction[]} options
     * @returns {CellActionSelectWeightedRandom}
     */
    static from(options) {
        const r = new CellActionSelectWeightedRandom();

        r.addManyOptions(options);


        return r;
    }

    /**
     *
     * @param {WeightedGridCellAction[]} options
     */
    addManyOptions(options) {
        const n = options.length;
        for (let i = 0; i < n; i++) {
            const action = options[i];

            this.addOption(action);
        }
    }

    /**
     *
     * @param {WeightedGridCellAction} option
     */
    addOption(option) {
        assert.equal(option.isWeightedGridCellAction, true, 'option.isWeightedGridCellAction !== true');

        this.options.push(option);
    }

    initialize(data, seed) {
        this.__random.setCurrentSeed(seed);

        const actions = this.options;
        const n = actions.length;

        for (let i = 0; i < n; i++) {
            const weightedGridCellAction = actions[i];

            weightedGridCellAction.initialize(data, seed);
        }
    }

    execute(data, x, y, rotation) {
        const elements = this.options;
        const n = elements.length;

        let totalWeight = 0;


        for (let i = 0; i < n; i++) {
            /**
             *
             * @type {WeightedGridCellAction}
             */
            const weightedElement = elements[i];

            /**
             *
             * @type {CellFilter}
             */
            const weightFilter = weightedElement.weight;

            const weightValue = weightFilter.execute(data, x, y, 0);


            if (weightValue > 0) {
                //if the weight is negative, we clamp it to 0

                totalWeight += weightValue;
            }

            evaluatedWeights[i] = totalWeight;

        }

        const targetWeight = this.__random() * totalWeight;

        const index = binarySearchLowIndex(evaluatedWeights, targetWeight, compareNumbers, 0, n - 1);

        const targetElement = elements[index];

        targetElement.action.execute(data, x, y, rotation);
    }
}
