import { GridCellAction } from "../placement/GridCellAction.js";
import { assert } from "../../core/assert.js";

let idCounter = 0;

export class GridCellActionPlaceMarkerGroup extends GridCellAction {
    constructor() {
        super();

        /**
         *
         * @type {GridCellActionPlaceMarker[]}
         */
        this.children = [];
    }

    /**
     *
     * @param {GridCellActionPlaceMarkerGroup} children
     * @returns {GridCellActionPlaceMarkerGroup}
     */
    static from(children) {
        assert.isArray(children, 'children');

        const r = new GridCellActionPlaceMarkerGroup();

        r.children = children;

        return r;
    }

    execute(data, x, y, rotation) {
        const id = idCounter++;

        const children = this.children;
        const n = children.length;
        for (let i = 0; i < n; i++) {
            const child = children[i];

            const node = child.buildNode(data, x, y, rotation);

            node.properties.groupId = id;

            data.addMarker(node);
        }
    }
}
