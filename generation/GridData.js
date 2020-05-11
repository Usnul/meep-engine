import { assert } from "../core/assert.js";
import { QuadTreeNode } from "../core/geom/2d/quad-tree/QuadTreeNode.js";
import Vector2 from "../core/geom/Vector2.js";

export class GridData {
    constructor() {
        this.width = 0;
        this.height = 0;

        /**
         *
         * @type {Vector2}
         */
        this.scale = new Vector2(1, 1);

        /**
         *
         * @type {Uint32Array}
         */
        this.tags = new Uint32Array();

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
        const cellIndex = y * this.width + x;
        return this.tags[cellIndex];
    }
}
