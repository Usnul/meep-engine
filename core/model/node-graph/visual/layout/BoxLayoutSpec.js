import AABB2 from "../../../../geom/AABB2.js";

export class BoxLayoutSpec {
    constructor() {
        this.bounds = new AABB2();

        /**
         *
         * @type {ConnectionLayoutSpec[]}
         */
        this.connections = [];

        /**
         *
         * @type {boolean}
         */
        this.locked = false;
    }
}
