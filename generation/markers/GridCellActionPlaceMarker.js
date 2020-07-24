import { GridCellAction } from "../placement/GridCellAction.js";
import { MarkerNode } from "./MarkerNode.js";
import { Transform } from "../../engine/ecs/transform/Transform.js";
import Vector2 from "../../core/geom/Vector2.js";
import { assert } from "../../core/assert.js";

export class GridCellActionPlaceMarker extends GridCellAction {
    constructor() {
        super();

        /**
         *
         * @type {String}
         */
        this.type = null;

        /**
         *
         * @type {Transform}
         */
        this.transform = new Transform();

        /**
         *
         * @type {String[]}
         */
        this.tags = [];

        this.properties = {};

        this.size = 0;

        /**
         *
         * @type {MarkerNodeTransformer[]}
         */
        this.transformers = [];

        /**
         *
         * @type {Vector2}
         */
        this.offset = new Vector2();
    }

    initialize(data, seed) {
        super.initialize(data, seed);

        const transformers = this.transformers;

        const n = transformers.length;
        for (let i = 0; i < n; i++) {
            const nodeTransformer = transformers[i];

            nodeTransformer.initialize(grid, seed);
        }
    }

    /**
     *
     * @param {String} tag
     * @returns {boolean}
     */
    addTag(tag) {
        assert.typeOf(tag, 'string', 'tag');

        if (this.tags.indexOf(tag) !== -1) {
            return false;
        }

        this.tags.push(tag);

        return true;
    }

    /**
     *
     * @param {MarkerNodeTransformer} transformer
     */
    addTransformer(transformer) {
        assert.equal(transformer.isMarkerNodeTransformer, true, 'transformer.isMarkerNodeTransformer !== true');

        this.transformers.push(transformer);
    }

    /**
     *
     * @param {String} type
     * @param {number} [size=0]
     * @param {MarkerNodeTransformer[]} [transformers]
     * @param {string[]} [tags]
     * @param {Transform} [transform]
     * @return {GridCellActionPlaceMarker}
     */
    static from({
                    type,
                    size = 0,
                    transformers = [],
                    tags = [],
                    transform
                }) {

        assert.typeOf(type, 'string', 'type');

        const r = new GridCellActionPlaceMarker();

        r.type = type;
        r.size = size;

        if (transform !== undefined) {
            r.transform.copy(transform);
        }

        for (let i = 0; i < transformers.length; i++) {
            r.addTransformer(transformers[i]);
        }

        for (let i = 0; i < tags.length; i++) {
            r.addTag(tags[i]);
        }

        return r;
    }

    /**
     *
     * @param {GridData} data
     * @param {number} x
     * @param {number} y
     * @param {number} rotation
     * @returns {MarkerNode}
     */
    buildNode(data, x, y, rotation) {

        let node = new MarkerNode();


        const sin = Math.sin(rotation);
        const cos = Math.cos(rotation);


        //rotate offset position
        const offset = this.offset;

        const offsetY = offset.y;
        const offsetX = offset.x;

        const rotated_local_offset_x = offsetX * cos - offsetY * sin
        const rotated_local_offset_y = offsetX * sin + offsetY * cos;

        const target_x = rotated_local_offset_x + x;
        const target_y = rotated_local_offset_y + y;

        node.position.set(target_x, target_y);
        node.type = this.type;

        node.size = this.size;

        node.transform.position.set(
            target_x * data.transform.scale_x + data.transform.offset_x,
            0,
            target_y * data.transform.scale_y + data.transform.offset_y
        );

        node.transform.rotation.__setFromEuler(0, -rotation, 0);

        node.transform.multiplyTransforms(node.transform, this.transform);

        //add tags
        const tags = this.tags;
        const tagCount = tags.length;
        for (let i = 0; i < tagCount; i++) {
            const tag = tags[i];
            node.tags.push(tag);
        }

        //write properties
        Object.assign(node.properties, this.properties);

        //apply transformations
        const transformers = this.transformers;
        const transformerCount = transformers.length;

        for (let i = 0; i < transformerCount; i++) {
            const transformer = transformers[i];
            node = transformer.transform(node, grid);
        }

        return node;
    }

    execute(data, x, y, rotation) {
        const node = this.buildNode(data, x, y, rotation);

        data.addMarker(node);
    }
}

/**
 * @readonly
 * @type {boolean}
 */
GridCellActionPlaceMarker.prototype.isGridCellActionPlaceMarker = true;
