import { Action } from "../Action.js";
import { Sampler2D } from "../../../engine/graphics/texture/sampler/Sampler2D.js";

export class PatchTerrainHeightAction extends Action {
    /**
     *
     * @param {Terrain} terrain
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    constructor(terrain, x, y, width, height) {
        super();

        /**
         *
         * @type {Terrain}
         */
        this.terrain = terrain;

        /**
         *
         * @type {Sampler2D}
         */
        this.patch = Sampler2D.float32(1, width, height);

        this.x = x;
        this.y = y;

        this.__oldPatch = Sampler2D.float32(1, width, height);
    }

    updateTerrain() {
        /**
         *
         * @type {Terrain}
         */
        const terrain = this.terrain;

        /**
         *
         * @type {Sampler2D}
         */
        const heightMap = terrain.heightMap;

        /**
         *
         * @type {TerrainTileManager}
         */
        const tiles = terrain.tiles;

        tiles.buildWorker.setHeightSampler(heightMap.data, heightMap.itemSize, heightMap.width, heightMap.height);

        const terrainSize = terrain.size;

        const u0 = this.x / heightMap.width;
        const u1 = (this.x + this.patch.width) / heightMap.height;

        const v0 = this.y / heightMap.height;
        const v1 = (this.y + this.patch.height) / heightMap.height;

        const tx0 = u0 * terrainSize.x;
        const tx1 = u1 * terrainSize.x;

        const ty0 = v0 * terrainSize.y;
        const ty1 = v1 * terrainSize.y;

        const dirtyTiles = tiles.getRawTilesOverlappingRectangle(tx0 - 1, ty0 - 1, tx1 + 1, ty1 + 1);

        dirtyTiles.forEach(tile => {
            tile.isBuilt = false;
        });
    }

    apply(context) {

        /**
         *
         * @type {Terrain}
         */
        const terrain = this.terrain;

        /**
         *
         * @type {Sampler2D}
         */
        const heightMap = terrain.heightMap;

        //store old data from the patch
        const oldPatch = this.__oldPatch;

        oldPatch.copy_sameItemSize(heightMap, this.x, this.y, 0, 0, oldPatch.width, oldPatch.height);

        const patch = this.patch;
        //apply the patch
        heightMap.copy_sameItemSize(patch, 0, 0, this.x, this.y, patch.width, patch.height);

        this.updateTerrain();
    }

    revert(context) {

        /**
         *
         * @type {Terrain}
         */
        const terrain = this.terrain;

        /**
         *
         * @type {Sampler2D}
         */
        const heightMap = terrain.heightMap;

        const patch = this.__oldPatch;

        //apply the patch
        heightMap.copy_sameItemSize(patch, 0, 0, this.x, this.y, patch.width, patch.height);

        this.updateTerrain();
    }
}
