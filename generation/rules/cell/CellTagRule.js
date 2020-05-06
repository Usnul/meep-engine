import Vector2 from "../../../core/geom/Vector2.js";

export class CellTagRule {
    constructor() {
        /**
         *
         * @type {TagRule}
         */
        this.rule = null;

        /**
         *
         * @type {Vector2}
         */
        this.position = new Vector2();
    }
}