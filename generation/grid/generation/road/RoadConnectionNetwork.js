import { QuadTreeNode } from "../../../../core/geom/2d/quad-tree/QuadTreeNode.js";
import AABB2 from "../../../../core/geom/AABB2.js";
import { assert } from "../../../../core/assert.js";
import { PathEndPointKind } from "./PathEndPointKind.js";
import { readMarkerNodeGroupId } from "./readMarkerNodeGroupId.js";

/**
 *
 * @type {QuadTreeDatum<RoadConnection>[]}
 */
const tempArrayPath = [];

const bounds = new AABB2();

export class RoadConnectionNetwork {
    constructor() {

        /**
         *
         * @type {QuadTreeNode<RoadConnection>}
         */
        this.index = new QuadTreeNode();

        this.width = -1;

        /**
         *
         * @type {Map<number, RoadConnection[]>}
         */
        this.groupLookup = new Map();
    }

    /**
     *
     * @param {Path[]} result
     */
    requestAll(result) {
        this.index.getRawData(result);
    }

    /**
     *
     * @param {number} id
     * @returns {boolean}
     */
    isGroupConnected(id) {
        return this.groupLookup.has(id);
    }

    /**
     * A connection exists where source is of group A and target is of group B or vice-versa
     * @param {number} a Group ID
     * @param {number} b Group ID
     * @returns {boolean}
     */
    directGroupConnectionExists(a, b) {
        const connections = this.groupLookup.get(a);

        if (connections === undefined) {
            return false;
        }

        const n = connections.length;

        for (let i = 0; i < n; i++) {
            const road = connections[i];

            if (road.isAttachedToMarkerGroup(b)) {
                return true;
            }
        }
    }

    /**
     *
     * @param {RoadConnection} path
     * @param {PathEndPoint} endpoint
     * @private
     */
    __registerPathEndpoint(path, endpoint) {

        if (endpoint.type === PathEndPointKind.Node) {
            const groupId = readMarkerNodeGroupId(endpoint.attachment);


            let connections = this.groupLookup.get(groupId);

            if (connections === undefined) {
                connections = [path];
                this.groupLookup.set(groupId, connections);
            } else {
                connections.push(path);
            }

        }
    }

    /**
     *
     * @param {RoadConnection} path
     */
    add(path) {
        path.computeBounds(bounds, this.width);

        this.index.add(path, bounds.x0, bounds.y0, bounds.x1, bounds.y1);

        this.__registerPathEndpoint(path, path.source);
        this.__registerPathEndpoint(path, path.target);

    }

    /**
     *
     * @param {RoadConnection[]} result
     * @param {number} x
     * @param {number} y
     * @returns {number}
     */
    requestPathsAt(result, x, y) {

        assert.greaterThanOrEqual(this.width, 0, 'width must be greater or equal to 0');

        const q_x0 = x - 0.1;
        const q_y0 = y - 0.1;
        const q_x1 = x + 0.1;
        const q_y1 = y + 0.1;

        const pathIntersections = this.index.requestDatumIntersectionsRectangle(tempArrayPath, q_x0, q_y0, q_x1, q_y1);
        let resultCount = 0;

        if (pathIntersections > 0) {

            const index = x + y * this.width;

            for (let j = 0; j < pathIntersections; j++) {

                const encounteredPathDatum = tempArrayPath[j];

                /**
                 *
                 * @type {Path}
                 */
                const encounteredPath = encounteredPathDatum.data;

                if (encounteredPath.test(index)) {

                    result[resultCount++] = encounteredPath;

                }

            }
        }

        return resultCount;
    }
}
