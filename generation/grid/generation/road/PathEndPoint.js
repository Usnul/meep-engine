import Vector2 from "../../../../core/geom/Vector2.js";
import { PathEndPointKind } from "./PathEndPointKind.js";
import { assert } from "../../../../core/assert.js";
import { readMarkerNodeGroupId } from "./readMarkerNodeGroupId.js";

export class PathEndPoint {
    constructor() {

        this.position = new Vector2();

        this.type = PathEndPointKind.Unknown;

        /**
         *
         * @type {MarkerNode|Path}
         */
        this.attachment = null;
    }

    /**
     *
     * @param {MarkerNode} node
     * @returns {PathEndPoint}
     */
    static fromNode(node) {
        assert.defined(node, 'node');
        assert.ok(node.isMarkerNode, 'node.isMarkerNode !== true');

        const r = new PathEndPoint();

        r.attachment = node;
        r.type = PathEndPointKind.Node;
        r.position.copy(node.position);

        return r;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {Path} path
     * @returns {PathEndPoint}
     */
    static fromPath(x, y, path) {
        const r = new PathEndPoint();

        r.attachment = path;
        r.type = PathEndPointKind.Path;
        r.position.set(x, y);

        return r;
    }


    /**
     *
     * @param {MarkerNode} node
     * @returns {boolean}
     */
    isAttachedToNode(node) {
        return this.type === PathEndPointKind.Node && this.attachment === node;
    }

    /**
     *
     * @param {number} id
     * @returns {boolean}
     */
    isAttachedToMarkerGroup(id) {
        return this.type === PathEndPointKind.Node && readMarkerNodeGroupId(this.attachment) === id;
    }
}
