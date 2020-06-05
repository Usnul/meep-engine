export class MarkerNodeTransformer {
    /**
     *
     * @param {GridData} grid
     * @param {number} seed
     */
    initialize(grid, seed) {

    }

    /**
     *
     * @param {MarkerNode} node
     * @param {GridData} grid
     */
    transform(node, grid) {
        throw new Error(`Not implemented`);
    }
}

/**
 * @readonly
 * @type {boolean}
 */
MarkerNodeTransformer.prototype.isMarkerNodeTransformer = true;
