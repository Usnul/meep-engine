/**
 * Created by Alex on 15/03/2016.
 */
import List from '../../../core/collection/List.js';
import Vector2 from '../../../core/geom/Vector2.js';
import Rectangle from '../../../core/geom/Rectangle.js';
import Vector1 from "../../../core/geom/Vector1.js";

class TileGrid {
    /**
     *
     * @param {number} width
     * @param {number} height
     * @constructor
     */
    constructor(width, height) {

        this.size = new Vector2(width, height);
        /**
         *
         * @type {List<Rectangle>}
         */
        this.tiles = new List();
        /**
         *
         * @type {Vector1}
         */
        this.capacity = new Vector1(width * height);
    }

    /**
     *
     * @return {number}
     */
    computeTotalTileArea() {
        let result = 0;

        const tiles = this.tiles;
        const n = tiles.length;


        for (let i = 0; i < n; i++) {
            const rectangle = tiles.get(i);

            result += rectangle.computeArea();
        }

        return result;
    }

    /**
     *
     * @param {Rectangle} rect
     * @returns {Array<Rectangle>}
     */
    getOverlappingTiles(rect) {
        const result = [];

        this.getOverlappingTilesRaw(result, rect.position.x, rect.position.y, rect.size.x, rect.size.y);

        return result;
    }

    /**
     *
     * @param {Rectangle[]} result tiles will be added here
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @returns {number} number of overlapping tiles found
     */
    getOverlappingTilesRaw(result, x, y, w, h) {
        const tiles = this.tiles;

        const l = tiles.length;

        const x1 = x + w;
        const y1 = y + h;

        let hits = 0;

        for (let i = 0; i < l; i++) {
            const tile = tiles.get(i);

            if (tile._overlaps(x, y, x1, y1)) {
                result.push(tile);

                hits++;
            }
        }

        return hits;
    }

    /**
     *
     * @param {Rectangle} tile
     * @returns {boolean}
     */
    contains(tile) {
        return this.tiles.indexOf(tile) !== -1;
    }

    /**
     * Look up a slot for a rectangular tile of a given size
     * @param {Vector2} result
     * @param {number} w
     * @param {number} h
     * @returns {boolean}
     */
    findEmptySlotFor(result, w, h) {
        let found = false;

        const overlaps = [];

        this.computePossibleTilePositions(w, h, (_x, _y) => {
            const overlapCount = this.getOverlappingTilesRaw(overlaps, _x, _y, w, h);

            if (overlapCount === 0) {

                result.set(_x, _y);

                found = true;

                //stop traversal
                return false;
            }
        });

        return found;
    }

    /**
     *
     * @param {number} tileWidth
     * @param {number} tileHeight
     * @param {function(x:number, y:number):*} visitor
     */
    computePossibleTilePositions(tileWidth, tileHeight, visitor) {

        for (let x = 0, w = this.size.x; x <= w - tileWidth; x++) {
            for (let y = 0, h = this.size.y; y <= h - tileHeight; y++) {
                const continueTraversal = visitor(x, y);

                if (continueTraversal === false) {
                    //visitor signalled termination of traversal
                    return;
                }
            }
        }
    }

    /**
     *
     * @param {Rectangle} tile
     */
    add(tile) {
        this.tiles.add(tile);
    }

    /**
     *
     * @param {Array.<Rectangle>} tiles
     */
    addAll(tiles) {
        this.tiles.addAll(tiles);
    }
}

export default TileGrid;
