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
         * @type {MarkerNodeAction}
         */
        this.action = null;

        /**
         * If this rule is applied, no other rules may be applied to the same node
         * @type {boolean}
         */
        this.consume = true;
    }

    /**
     *
     * @param {MarkerNodeMatcher} matcher
     * @param {MarkerNodeTransformer[]} [transformers]
     * @param {MarkerNodeAction} action
     * @param {boolean} [consume]
     * @returns {MarkerProcessingRule}
     */
    static from({
                    matcher,
                    transformers = [],
                    action,
                    consume = true
                }) {

        assert.equal(matcher.isMarkerNodeMatcher, true, 'matcher.isMarkerNodeMatcher !== true');
        assert.equal(action.isMarkerNodeAction, true, 'action.isMarkerNodeAction !== true');

        assert.typeOf(consume, 'boolean', 'consume');


        const r = new MarkerProcessingRule();

        r.matcher = matcher;
        r.transformers = transformers;
        r.action = action;
        r.consume = consume;

        return r;
    }

    /**
     *
     * @param {GridData} grid
     * @param {number} seed
     */
    initialize(grid, seed) {
        assert.equal(grid.isGridData, true, 'grid.isGridData !== true');
        assert.isNumber(seed, 'seed');

        const transformers = this.transformers;
        const nT = transformers.length;

        for (let i = 0; i < nT; i++) {
            const transformer = transformers[i];
            transformer.initialize(grid, seed);
        }

        this.action.initialize(grid, seed);
    }
}
