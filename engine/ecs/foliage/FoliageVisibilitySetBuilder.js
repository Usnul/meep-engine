import { BVHVisitor } from "../../../core/bvh2/traversal/BVHVisitor.js";
import { BitSet } from "../../../core/binary/BitSet.js";

export class FoliageVisibilitySetBuilder extends BVHVisitor {
    constructor() {
        super();

        /**
         * Visibility filters
         * @type {(function(LeafNode):boolean)[]}
         */
        this.filters = [];

        /**
         *
         * @type {BitSet}
         */
        this.visibleSet = new BitSet();
        //prevent re-allocation
        this.visibleSet.__shrinkFactor = 0;
    }

    /**
     *
     * @param {(function(LeafNode):boolean)[]} filters
     */
    setFilters(filters) {
        this.filters = filters;
        this.filterCount = filters.length;
    }

    initialize() {
        this.visibleSet.reset();
    }

    visitLeaf(node) {

        const n = this.filterCount;

        const filters = this.filters;

        for (let i = 0; i < n; i++) {
            const visibilityFilter = filters[i];

            if (!visibilityFilter(node)) {
                //not visible
                return;
            }

        }

        const index = node.object;

        //TODO check screen space size to decide if element should be seen or not
        this.visibleSet.set(index, true);
    }
}
