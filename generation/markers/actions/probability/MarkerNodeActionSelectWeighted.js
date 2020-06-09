import { MarkerNodeAction } from "../MarkerNodeAction.js";
import { seededRandom } from "../../../../core/math/MathUtils.js";
import { compareNumbers } from "../../../../core/primitives/numbers/compareNumbers.js";
import { assert } from "../../../../core/assert.js";
import { binarySearchLowIndex } from "../../../../core/collection/ArrayUtils.js";

/**
 *
 * @type {number[]}
 */
const evaluatedWeights = [];

export class MarkerNodeActionSelectWeighted extends MarkerNodeAction {
    constructor() {
        super();

        /**
         *
         * @type {MarkerNodeActionWeightedElement[]}
         */
        this.elements = [];

        this.__random = seededRandom(0);
    }

    /**
     *
     * @returns {MarkerNodeActionSelectWeighted}
     * @param {MarkerNodeActionWeightedElement[]} elements
     */
    static from(elements) {
        assert.isArray(elements, 'elements');

        const r = new MarkerNodeActionSelectWeighted();

        r.elements = elements;

        return r;
    }

    initialize(grid, seed) {
        this.__random.setCurrentSeed(seed);

        const elements = this.elements;
        const n = elements.length;

        for (let i = 0; i < n; i++) {
            /**
             *
             * @type {MarkerNodeActionWeightedElement}
             */
            const element = elements[i];

            element.initialize(grid, seed + i);
        }

        super.initialize(grid, seed);
    }

    execute(grid, ecd, node) {
        const elements = this.elements;
        const n = elements.length;

        let totalWeight = 0;

        for (let i = 0; i < n; i++) {
            /**
             *
             * @type {MarkerNodeActionWeightedElement}
             */
            const weightedElement = elements[i];

            /**
             *
             * @type {CellFilter}
             */
            const weightFilter = weightedElement.weight;

            /**
             *
             * @type {Vector2}
             */
            const nodePosition = node.position;

            const weightValue = weightFilter.execute(grid, nodePosition.x, nodePosition.y, 0);


            if (weightValue > 0) {
                //if the weight is negative, we clamp it to 0

                totalWeight += weightValue;
            }

            evaluatedWeights[i] = totalWeight;

        }

        const targetWeight = this.__random() * totalWeight;

        const index = binarySearchLowIndex(evaluatedWeights, targetWeight, compareNumbers, 0, n - 1);

        const targetElement = elements[index];

        targetElement.action.execute(grid, ecd, node);
    }
}
