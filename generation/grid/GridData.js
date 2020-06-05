import { assert } from "../../core/assert.js";
import { QuadTreeNode } from "../../core/geom/2d/quad-tree/QuadTreeNode.js";
import { OffsetScaleTransform2D } from "../../engine/ecs/terrain/ecs/OffsetScaleTransform2D.js";

export class GridData {
    constructor() {
        this.width = 0;
        this.height = 0;

        /**
         *
         * @type {OffsetScaleTransform2D}
         */
        this.transform = new OffsetScaleTransform2D();

        /**
         *
         * @type {QuadTreeNode<MarkerNode>}
         */
        this.markers = new QuadTreeNode();

        /**
         * Discrete data layers
         * @type {GridDataLayer[]}
         */
        this.layers = [];
    }

    /**
     *
     * @param {GridDataLayer} layer
     */
    addLayer(layer) {
        assert.equal(layer.isGridDataLayer, true, 'layer.GridDataLayer !== true');


        const existing = this.getLayerById(layer.id);


        if (existing === layer) {
            //layer is already attached
            return;
        }

        if (existing !== undefined) {
            throw new Error(`Layer with ID '${layer.id}' already exists. ID must be unique`);
        }

        layer.resize(this.width, this.height);

        this.layers.push(layer);
    }

    /**
     *
     * @param {string} id
     * @returns {GridDataLayer|undefined}
     */
    getLayerById(id) {
        const layers = this.layers;

        const n = layers.length;

        for (let i = 0; i < n; i++) {
            const layer = layers[i];

            if (layer.id === id) {
                return layer;
            }
        }

        return undefined;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {MarkerNodeMatcher} matcher
     * @returns {boolean}
     */
    containsMarkerInCircle(x, y, radius, matcher) {
        let result = false;
        this.markers.traverseCircleIntersections(x, y, radius, data => {
            /**
             *
             * @type {MarkerNode}
             */
            const marker = data.data;

            if (matcher.match(marker)) {
                result = true;

                //stop traversal
                return false;
            }
        });

        return result;
    }

    /**
     *
     * @param tileSize
     */
    computeScale(tileSize) {
        this.transform.scale_x = tileSize;
        this.transform.scale_y = tileSize;

        this.transform.offset_x = tileSize / 2;
        this.transform.offset_y = tileSize / 2;
    }

    /**
     *
     * @param {MarkerNode} node
     */
    addMarker(node) {
        const p = node.position;

        const x = p.x;
        const y = p.y;

        const r = node.size;

        this.markers.add(node, x - r, y - r, x + r, y + r);
    }

    /**
     *
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        assert.typeOf(width, 'number', 'width');
        assert.typeOf(height, 'number', 'height');

        if (width === this.width && height === this.height) {
            //no need, already the right size
            return;
        }

        this.width = width;
        this.height = height;

        const layers = this.layers;

        const n = layers.length;

        for (let i = 0; i < n; i++) {
            const layer = layers[i];

            layer.resize(width, height);
        }
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} mask
     */
    clearTags(x, y, mask) {

        const cellIndex = y * this.width + x;

        const current = this.tags[cellIndex];

        const newValue = current & (~mask);

        this.tags[cellIndex] = newValue;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} tags
     */
    writeTags(x, y, tags) {
        const cellIndex = y * this.width + x;

        this.tags[cellIndex] = tags;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} mask
     */
    setTags(x, y, mask) {

        const cellIndex = y * this.width + x;

        const current = this.tags[cellIndex];

        const newValue = current | mask;

        this.tags[cellIndex] = newValue;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @return {number}
     */
    readTags(x, y) {
        const _x = x | 0;
        const _y = y | 0;

        const cellIndex = _y * this.width + _x;

        return this.tags[cellIndex];
    }
}


/**
 * @readonly
 * @type {boolean}
 */
GridData.prototype.isGridData = true;
