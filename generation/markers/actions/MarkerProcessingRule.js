import { assert } from "../../../core/assert.js";

export class MarkerProcessingRule {
    constructor() {
        /**
         * @type {MarkerNodeMatcher}
         */
        this.matcher = null;


        /**
         *
         * @type {MarkerNodeTransformer[]}
         */
        this.transformers = [];

        /**
         *
         * @type {MarkerNodeAction[]}
         */
        this.actions = [];

        /**
         * If this rule is applied, no other rules may be applied to the same node
         * @type {boolean}
         */
        this.consume = true;
    }

    /**
     *
     * @param {number} seed
     */
    initialize(seed) {
        assert.isNumber(seed, 'seed');

        const transformers = this.transformers;
        const nT = transformers.length;

        for (let i = 0; i < nT; i++) {
            const transformer = transformers[i];
            transformer.initialize(seed);
        }

        const actions = this.actions;
        const nA = actions.length;

        for (let i = 0; i < nA; i++) {
            const action = actions[i];
            //TODO initialize actions
        }

    }
}
