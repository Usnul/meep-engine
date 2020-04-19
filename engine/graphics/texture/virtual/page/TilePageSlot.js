import Vector2 from "../../../../../core/geom/Vector2.js";

export class TilePageSlot {
    /**
     *
     * @param {number} index
     * @constructor
     */
    constructor(index) {
        /**
         * @type {number}
         */
        this.index = index;
        /**
         * Sequential 2D position of the tile slot on the page
         * @type {Vector2}
         */
        this.position = new Vector2();

        /**
         *
         * @type {Tile|null}
         */
        this.tile = null;

        this.isWritten = false;
        this.isDirty = false;
    }

    empty() {
        this.tile = null;
        this.isDirty = this.isWritten;
        this.isWritten = false;
    }
}

