export class TileMoveInstruction {
    /**
     *
     * @param {Rectangle} tile
     * @param {number} targetX
     * @param {number} targetY
     * @param {TileGrid} target
     * @param {TileGrid} source
     */
    constructor(tile, targetX, targetY, target, source) {
        /**
         *
         * @type {Rectangle}
         */
        this.tile = tile;
        /**
         *
         * @type {number}
         */
        this.targetX = targetX;
        /**
         *
         * @type {number}
         */
        this.targetY = targetY;
        /**
         *
         * @type {TileGrid}
         */
        this.target = target;
        /**
         *
         * @type {TileGrid}
         */
        this.source = source;
    }

    /**
     * @returns {boolean}
     */
    validate() {
        if (this.targetX < 0) {
            return false;
        }

        if (this.targetY < 0) {
            return false;
        }

        if (this.targetX + this.tile.size.x > this.target.size.x) {
            return false;
        }

        if (this.targetY + this.tile.size.y > this.target.size.y) {
            return false;
        }

        return true;
    }

    execute() {
        if (this.source !== this.target) {
            //moving to different grid
            this.source.tiles.removeOneOf(this.tile);
            this.target.tiles.add(this.tile);
        }

        //update position
        this.tile.position.set(this.targetX, this.targetY);
    }
}
