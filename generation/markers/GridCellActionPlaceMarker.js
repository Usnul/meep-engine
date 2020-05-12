import { returnTrue } from "../../core/function/Functions.js";
import { GridCellAction } from "../placement/GridCellAction.js";
import { MarkerNode } from "./MarkerNode.js";
import { Transform } from "../../engine/ecs/components/Transform.js";

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
         * @type {function():boolean}
         */
        this.filter = returnTrue;

        /**
         *
         * @type {Transform}
         */
        this.transform = new Transform();
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

    execute(data, x, y, rotation) {
        const node = new MarkerNode();

        node.position.set(x, y);
        node.type = this.type;

        node.transofrm.position.set(x * data.scale.x, 0, y * data.scale.y);
        node.transofrm.rotation.__setFromEuler(0, rotation, 0);

        node.transofrm.multiplyTransforms(node.transofrm, this.transform);

        data.addMarker(node);
    }
}
