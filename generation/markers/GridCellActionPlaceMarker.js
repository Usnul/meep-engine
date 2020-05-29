import { noop } from "../../core/function/Functions.js";
import { GridCellAction } from "../placement/GridCellAction.js";
import { MarkerNode } from "./MarkerNode.js";
import { Transform } from "../../engine/ecs/components/Transform.js";
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

        /**
         *
         * @type {function(MarkerNode,GridData)}
         */
        this.mutator = noop;

        /**
         *
         * @type {Vector2}
         */
        this.offset = new Vector2();
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
     * @param {String} type
     * @return {GridCellActionPlaceMarker}
     */
    static from(type) {
        const r = new GridCellActionPlaceMarker();

        r.type = type;

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

        const node = new MarkerNode();


        const sin = Math.sin(rotation);
        const cos = Math.cos(rotation);


        //rotate offset position
        const offset = this.offset;

        const offsetY = offset.y;
        const offsetX = offset.x;

        const rotated_local_offset_x = offsetX * cos - offsetY * sin
        const rotated_local_offset_y = offsetX * sin - offsetY * cos;

        const target_x = rotated_local_offset_x + x;
        const target_y = rotated_local_offset_y + y;

        node.position.set(target_x, target_y);
        node.type = this.type;

        node.transofrm.position.set(
            target_x * data.transform.scale_x + data.transform.offset_x,
            0,
            target_y * data.transform.scale_y + data.transform.offset_y
        );

        node.transofrm.rotation.__setFromEuler(0, rotation, 0);

        node.transofrm.multiplyTransforms(node.transofrm, this.transform);

        //add tags
        const tags = this.tags;
        const tagCount = tags.length;
        for (let i = 0; i < tagCount; i++) {
            const tag = tags[i];
            node.tags.push(tag);
        }

        //write properties
        Object.assign(node.properties, this.properties);

        this.mutator(node, data);

        return node;
    }

    execute(data, x, y, rotation) {
        const node = this.buildNode(data, x, y, rotation);

        data.addMarker(node);
    }
}
