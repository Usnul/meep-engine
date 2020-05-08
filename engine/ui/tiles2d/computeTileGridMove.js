import { assert } from "../../../core/assert.js";
import { TileMoveProgram } from "./TileMoveProgram.js";
import { TileMoveInstruction } from "./TileMoveInstruction.js";
import { max2, min2 } from "../../../core/math/MathUtils.js";
import { aabb2_contains, aabb2_overlapExists } from "../../../core/geom/AABB2.js";


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

    const tilePositionDeltaX = targetX - tile.position.x;
    const tilePositionDeltaY = targetY - tile.position.y;


    /**
     *
     * @type {Rectangle[]}
     */
    const occludedTargetTiles = [];

    //find occluded tiles
    const targetTiles = target.tiles;
    const targetStartingTileCount = targetTiles.length;

    const sourceTiles = source.tiles;
    const sourceStartingTileCount = sourceTiles.length;

    for (let i = 0; i < targetStartingTileCount; i++) {
        const targetTile = targetTiles.get(i);

        if (targetTile === tile) {
            //skip self
            continue;
        }

        if (targetTile._overlaps(futureTileX0, futureTileY0, futureTileX1, futureTileY1)) {
            //occlusion detected
            occludedTargetTiles.push(targetTile);
        }
    }

    const result = new TileMoveProgram();

    //add initial move command
    result.add(new TileMoveInstruction(tile, targetX, targetY, target, source));

    const occlusionCount = occludedTargetTiles.length;

    if (occlusionCount > 0) {
        //find AABB extents of the overlapped tiles

        const firstOccludedElement = occludedTargetTiles[0];

        let occlusionRegionX0 = firstOccludedElement.position.x;
        let occlusionRegionY0 = firstOccludedElement.position.y;
        let occlusionRegionX1 = occlusionRegionX0 + firstOccludedElement.size.x;
        let occlusionRegionY1 = occlusionRegionY0 + firstOccludedElement.size.y;

        for (let i = 1; i < occlusionCount; i++) {
            const occludedElement = occludedTargetTiles[i];

            const x0 = occludedElement.position.x;
            const y0 = occludedElement.position.y;
            const x1 = x0 + occludedElement.size.x;
            const y1 = y0 + occludedElement.size.y;


            occlusionRegionX0 = min2(occlusionRegionX0, x0);
            occlusionRegionY0 = min2(occlusionRegionY0, y0);
            occlusionRegionX1 = max2(occlusionRegionX1, x1);
            occlusionRegionY1 = max2(occlusionRegionY1, y1);
        }

        //transform target occlusion region to source
        const sourceOcclusionRegionX0 = occlusionRegionX0 - tilePositionDeltaX;
        const sourceOcclusionRegionX1 = occlusionRegionX1 - tilePositionDeltaX;
        const sourceOcclusionRegionY0 = occlusionRegionY0 - tilePositionDeltaY;
        const sourceOcclusionRegionY1 = occlusionRegionY1 - tilePositionDeltaY;


        if (sourceOcclusionRegionX0 < 0 || sourceOcclusionRegionX1 > source.size.x || sourceOcclusionRegionY0 < 0 || sourceOcclusionRegionY1 > source.size.y) {
            //source region is off the grid, swap is not possible
            return null;
        }


        //find all tiles in the source grid that match the occlusion zone
        for (let i = 0; i < sourceStartingTileCount; i++) {
            const sourceTile = sourceTiles.get(i);

            if (sourceTile === tile) {
                //skip self
                continue;
            }

            const x0 = sourceTile.position.x;
            const y0 = sourceTile.position.y;

            const x1 = x0 + sourceTile.size.x;
            const y1 = y0 + sourceTile.size.y;

            if (!aabb2_overlapExists(sourceOcclusionRegionX0, sourceOcclusionRegionY0, sourceOcclusionRegionX1, sourceOcclusionRegionY1, x0, y0, x1, y1)) {
                //tile is outside of the transfer area
                continue;
            }

            if (!aabb2_contains(sourceOcclusionRegionX0, sourceOcclusionRegionY0, sourceOcclusionRegionX1, sourceOcclusionRegionY1, x0, y0, x1, y1)) {
                //tile only partially fits the occlusion region, no swap is possible
                return null;
            }

            const targetX = x0 + tilePositionDeltaX;
            const targetY = y0 + tilePositionDeltaY;

            //move tile to the target area
            result.add(new TileMoveInstruction(sourceTile, targetX, targetY, target, source));
        }

        //add instructions to move occluded tiles
        for (let i = 0; i < occlusionCount; i++) {
            const occludedElement = occludedTargetTiles[i];

            const position = occludedElement.position;

            const px = position.x;
            const py = position.y;

            const x = px - tilePositionDeltaX;
            const y = py - tilePositionDeltaY;

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
