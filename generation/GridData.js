import { assert } from "../core/assert.js";
import { QuadTreeNode } from "../core/geom/2d/quad-tree/QuadTreeNode.js";
import { OffsetScaleTransform2D } from "../engine/ecs/terrain/ecs/OffsetScaleTransform2D.js";
import { Sampler2D } from "../engine/graphics/texture/sampler/Sampler2D.js";

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
         * @type {Uint32Array}
         */
        this.tags = new Uint32Array();

        /**
         * Terrain height map
         * @type {Sampler2D}
         */
        this.heights = Sampler2D.float32(1, 1, 1);

        /**
         *
         * @type {QuadTreeNode<MarkerNode>}
         */
        this.markers = new QuadTreeNode();

        /**
         * Distance to a cell from the nearest starting position
         * @type {Uint16Array}
         */
        this.startDistances = new Uint16Array();
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

        const gridSize = width * height;

        this.tags = new Uint32Array(gridSize);
        this.startDistances = new Uint16Array(gridSize);

        this.heights.resize(width, height);
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
