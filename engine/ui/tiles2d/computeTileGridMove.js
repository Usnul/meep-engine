import { assert } from "../../../core/assert.js";
import { TileMoveProgram } from "./TileMoveProgram.js";
import { TileMoveInstruction } from "./TileMoveInstruction.js";
import { max2, min2 } from "../../../core/math/MathUtils.js";
import { aabb2_contains } from "../../../core/geom/AABB2.js";


/**
 *
 * @param {Rectangle} tile
 * @param {number} targetX
 * @param {number} targetY
 * @param {TileGrid} source
 * @param {TileGrid} target
 * @returns {TileMoveProgram}
 */
export function computeTileGridMove(tile, targetX, targetY, source, target) {
    assert.typeOf(targetX, 'number', 'targetX');
    assert.typeOf(targetY, 'number', 'targetY');

    assert.defined(tile, 'tile');
    assert.defined(source, 'source');
    assert.defined(target, 'target');

    //calculate new area for the tile
    const futureTileX0 = targetX;
    const futureTileY0 = targetY;

    const futureTileX1 = tile.size.x + futureTileX0;
    const futureTileY1 = tile.size.y + futureTileY0;


    /**
     *
     * @type {Rectangle[]}
     */
    const occluded = [];

    //find occluded tiles
    const targetTiles = target.tiles;
    const targetStartingTileCount = targetTiles.length;

    for (let i = 0; i < targetStartingTileCount; i++) {
        const targetTile = targetTiles.get(i);

        if (targetTile === tile) {
            //skip self
            continue;
        }

        if (targetTile._overlaps(futureTileX0, futureTileY0, futureTileX1, futureTileY1)) {
            //occlusion detected
            occluded.push(targetTile);
        }
    }

    const result = new TileMoveProgram();

    //add initial move command
    result.add(new TileMoveInstruction(tile, targetX, targetY, target, source));

    const occlusionCount = occluded.length;

    if (occlusionCount > 0) {
        //find AABB extents of the overlapped tiles

        const firstOccludedElement = occluded[0];

        let occlusionRegionX0 = firstOccludedElement.position.x;
        let occlusionRegionY0 = firstOccludedElement.position.y;
        let occlusionRegionX1 = occlusionRegionX0 + firstOccludedElement.size.x;
        let occlusionRegionY1 = occlusionRegionY0 + firstOccludedElement.size.y;

        for (let i = 1; i < occlusionCount; i++) {
            const occludedElement = occluded[i];

            const x0 = occludedElement.position.x;
            const y0 = occludedElement.position.y;
            const x1 = x0 + occludedElement.size.x;
            const y1 = y0 + occludedElement.size.y;


            occlusionRegionX0 = min2(occlusionRegionX0, x0);
            occlusionRegionY0 = min2(occlusionRegionY0, y0);
            occlusionRegionX1 = max2(occlusionRegionX1, x1);
            occlusionRegionY1 = max2(occlusionRegionY1, y1);
        }

        //see if the entire region is contained within target tile area
        if (!aabb2_contains(futureTileX0, futureTileY0, futureTileX1, futureTileY1, occlusionRegionX0, occlusionRegionY0, occlusionRegionX1, occlusionRegionY1)) {
            //can't do a swap
            return null;
        }


        //compute offset for occluded tiles
        const offsetX = tile.position.x - targetX;
        const offsetY = tile.position.y - targetY;

        //add instructions to move occluded tiles
        for (let i = 0; i < occlusionCount; i++) {
            const occludedElement = occluded[i];

            const position = occludedElement.position;

            const px = position.x;
            const py = position.y;

            const x = px + offsetX;
            const y = py + offsetY;

            result.add(new TileMoveInstruction(occludedElement, x, y, source, target));
        }
    }

    // if (!ENV_PRODUCTION) {
    //     if (!result.validate()) {
    //         throw new Error(`Program is invalid`);
    //     }
    // }

    return result;
}
