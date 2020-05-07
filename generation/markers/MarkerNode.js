import Vector2 from "../../core/geom/Vector2.js";
import { Transform } from "../../engine/ecs/components/Transform.js";

export class MarkerNode {
    constructor() {
        /**
         *
         * @type {String}
         */
        this.type = null;

        this.position = new Vector2();

        this.transofrm = new Transform();
    }
}
