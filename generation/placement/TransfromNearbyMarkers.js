import { GridCellAction } from "./GridCellAction.js";
import { MarkerNodeMatcherAny } from "../markers/matcher/MarkerNodeMatcherAny.js";
import { assert } from "../../core/assert.js";

export class TransfromNearbyMarkers extends GridCellAction {
    constructor() {
        super();

        /**
         *
         * @type {MarkerNodeMatcher}
         */
        this.matcher = MarkerNodeMatcherAny.INSTANCE;
        /**
         *
         * @type {number}
         */
        this.radius = 1;

        /**
         *
         * @type {MarkerNodeTransformer[]}
         */
        this.transformers = [];

        /**
         * @private
         * @type {QuadTreeDatum<MarkerNode>[]}
         */
        this.__leaves = [];

        /**
         *
         * @type {number}
         * @private
         */
        this.__leaf_cursor = 0;
    }

    /**
     *
     * @param {number} radius
     * @param {MarkerNodeMatcher} matcher
     * @param {MarkerNodeTransformer[]} transformers
     * @returns {TransfromNearbyMarkers}
     */
    static from(radius, matcher, transformers) {
        assert.greaterThanOrEqual(radius, 0, 'radius');
        assert.equal(matcher.isMarkerNodeMatcher, true, 'matcher.isMarkerNodeMatcher');
        assert.isArray(transformers, 'transformers');

        const r = new TransfromNearbyMarkers();

        r.radius = radius;
        r.matcher = matcher;
        r.transformers = transformers;

        return r;
    }

    initialize(data, seed) {
        super.initialize(data, seed);

        this.transformers.forEach(t => t.initialize(data, seed));
    }

    /**
     *
     * @param {QuadTreeDatum<MarkerNode>} leaf
     * @private
     */
    __visitMarker(leaf) {
        /**
         *
         * @type {MarkerNode}
         */
        const marker = leaf.data;

        const is_match = this.matcher.match(marker);

        if (is_match) {

            this.__leaves[this.__leaf_cursor] = leaf;

            this.__leaf_cursor++;

        }
    }

    execute(data, x, y, rotation) {

        const transformers = this.transformers;

        const transformerCount = transformers.length;

        // reset cursor
        this.__leaf_cursor = 0;

        data.markers.traverseCircleIntersections(x, y, this.radius, this.__visitMarker, this);

        const match_count = this.__leaf_cursor;
        const leaves = this.__leaves;

        // remove leaves
        for (let i = 0; i < match_count; i++) {
            const leaf = leaves[i];

            leaf.disconnect();
        }

        // transform and re-insert
        for (let i = 0; i < match_count; i++) {
            const leaf = leaves[i];

            let node = leaf.data;

            // transform
            for (let j = 0; j < transformerCount; j++) {
                const transformer = transformers[j];

                node = transformer.transform(node, data);
            }

            // insert the node
            data.addMarker(node);
        }
    }
}
