/**
 * Created by Alex on 21/05/2016.
 */
import ObservedValue from '../../../../core/model/ObservedValue.js';
import Vector2 from '../../../../core/geom/Vector2.js';
import Signal from '../../../../core/events/signal/Signal.js';
import TerrainTile from './TerrainTile.js';

import { BinaryNode } from '../../../../core/bvh2/BinaryNode.js';

import CheckersTexture from '../../../graphics/texture/CheckersTexture.js';


import { MeshPhongMaterial } from 'three';
import { assert } from "../../../../core/assert.js";
import { Color } from "../../../../core/color/Color.js";
import { randomFloatBetween } from "../../../../core/math/MathUtils.js";
import { noop } from "../../../../core/function/Functions.js";
import Vector3 from "../../../../core/geom/Vector3.js";
import { SurfacePoint3 } from "../../../../core/geom/3d/SurfacePoint3.js";
import { RaycastBVHVisitor } from "../../../../core/bvh2/traversal/RaycastBVHVisitor.js";
import { FirstRayIntersectionTerrainBVHVisitor } from "./FirstRayIntersectionTerrainBVHVisitor.js";
import { traverseBinaryNodeUsingVisitor } from "../../../../core/bvh2/traversal/traverseBinaryNodeUsingVisitor.js";
import { aabb2_overlapExists } from "../../../../core/geom/AABB2.js";
import ObservedInteger from "../../../../core/model/ObservedInteger.js";

class TerrainTileManager {
    /**
     *
     * @param {Vector2} [tileSize]
     * @param {Material} [material]
     * @param {WorkerProxy} buildWorker
     */
    constructor(
        {
            material,
            buildWorker
        }
    ) {

        /**
         *
         * @type {TerrainTile[]}
         */
        this.tiles = [];

        this.on = {
            tileBuilt: new Signal(),
            tileDestroyed: new Signal()
        };

        /**
         *
         * @type {Vector2}
         */
        this.tileSize = new Vector2(10, 10);

        /**
         *
         * @type {Vector2}
         */
        this.totalSize = new Vector2(1, 1);

        if (material === undefined) {
            const defaultMaterialTexture = CheckersTexture.create(this.totalSize.clone()._sub(1, 1).multiplyScalar(0.5));
            material = new MeshPhongMaterial({ map: defaultMaterialTexture });
        }

        this.material = new ObservedValue(material);

        /**
         * Number of subdivisions per single grid cell
         * @type {ObservedInteger}
         */
        this.resolution = new ObservedInteger(4);

        /**
         * 2D Scale of the terrain
         * @type {Vector2}
         */
        this.scale = new Vector2(1, 1);

        /**
         *
         * @type {WorkerProxy}
         */
        this.buildWorker = buildWorker;

        this.bvh = new BinaryNode();

        /**
         *
         * @type {number}
         */
        this.heightRange = 0;

        /**
         * Debug parameter, makes all tiles have random colored material for easy visual distinction
         * @type {boolean}
         */
        this.debugTileMaterialRandom = false;

        this.material.onChanged.add(() => {
            this.traverse(this.assignTileMaterial, this);
        });


    }

    initialize() {
        this.destroyTiles();

        this.bvh.setNegativelyInfiniteBounds();

        this.initializeTiles();
    }

    /**
     *
     * @param {Vector3} origin
     * @param {Vector3} direction
     * @param {function} callback
     * @param {function} missCallback
     */
    raycast(origin, direction, callback, missCallback) {
        assert.typeOf(callback, 'function', 'callback');
        assert.typeOf(missCallback, 'function', 'missCallback');

        let bestHit = null;
        let bestNormal = null;
        let bestGeometry = null;
        let bestDistanceSqr = Number.POSITIVE_INFINITY;

        let firstStageOver = false;

        let tileCount = 0;

        function tryReturn() {
            if (tileCount === 0 && firstStageOver) {
                callback(bestHit, bestNormal, bestGeometry);
            }
        }

        function registerHit(hit, normal, geo) {
            const d = hit.distanceSqrTo(origin);
            if (d < bestDistanceSqr) {
                bestDistanceSqr = d;
                bestHit = hit;
                bestNormal = normal;
                bestGeometry = geo;
            }
        }


        /**
         *
         * @param {TerrainTile} tile
         */
        function doCast(tile) {

            tile.raycast(origin, direction, registerHit, missCallback);
            tileCount--;
            tryReturn();
        }

        this.bvh.traverseRayLeafIntersections(origin.x, origin.y, origin.z, direction.x, direction.y, direction.z, function (leaf) {
            /**
             *
             * @type {TerrainTile}
             */
            const tile = leaf.object;

            tileCount++;

            if (tile.isBuilt) {
                doCast(tile);
            } else {
                tile.onBuilt.addOne(doCast);
            }
        });

        firstStageOver = true;
        tryReturn();
    }

    /**
     *
     * @param {TerrainTile} tile
     */
    assignTileMaterial(tile) {
        let material = this.material.getValue();

        if (this.debugTileMaterialRandom) {
            const color = new Color();
            color.setHSV(Math.random(), randomFloatBetween(Math.random, 0.4, 1), 1);
            material = new MeshPhongMaterial({ color: color.toUint() });
        }

        tile.material = material;
        if (tile.mesh !== null) {
            tile.mesh.material = material;
        }
    }

    /**
     *
     * @param {function(tile:TerrainTile)} callback
     * @param {*} [thisArg]
     */
    traverse(callback, thisArg) {
        const tiles = this.tiles;
        let tile;
        let i = 0;
        const il = tiles.length;
        for (; i < il; i++) {
            tile = tiles[i];
            callback.call(thisArg, tile);
        }
    }

    destroyTiles() {

        //destroy all existing tiles
        this.tiles.forEach(this.release, this);

        this.tiles.splice(0, this.tiles.length);

        //clear out BVH
        this.bvh.right = null;
        this.bvh.left = null;

    }

    /**
     * Rebuild all tiles
     */
    rebuild() {
        this.destroyTiles();

        this.initializeTiles();
    }

    /**
     *
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @returns {TerrainTile[]}
     */
    getRawTilesOverlappingRectangle(x0, y0, x1, y1) {
        /**
         *
         * @type {TerrainTile[]}
         */
        const result = [];

        const terrainTiles = this.tiles;

        const n = terrainTiles.length;

        for (let i = 0; i < n; i++) {
            const tile = terrainTiles[i];

            const tx0 = tile.position.x;
            const ty0 = tile.position.y;

            const tx1 = tx0 + tile.size.x;
            const ty1 = ty0 + tile.size.y;
            if (
                aabb2_overlapExists(
                    x0, y0, x1, y1,
                    tx0, ty0, tx1, ty1
                )
            ) {
                result.push(tile);
            }
        }

        return result;
    }

    initializeTiles() {

        const gridSize = this.totalSize.clone().divide(this.tileSize).ceil();

        const tileCount = gridSize.x * gridSize.y;

        const tiles = this.tiles;

        const self = this;

        function ensureBuilt(x, y) {
            return function (resolve) {
                self.obtain(x, y).then(resolve);
            }
        }

        //populate tiles
        for (let y = 0; y < gridSize.y; y++) {
            const tY = y < gridSize.y - 1 ? this.tileSize.y : (this.totalSize.y - this.tileSize.y * y);
            for (let x = 0; x < gridSize.x; x++) {
                const tX = x < gridSize.x - 1 ? this.tileSize.x : (this.totalSize.x - this.tileSize.x * x);

                const tile = new TerrainTile();
                tiles[y * gridSize.x + x] = tile;

                this.assignTileMaterial(tile);

                tile.gridPosition.set(x, y);

                tile.size.set(tX, tY);
                tile.position.set(this.tileSize.x * x, this.tileSize.y * y);
                tile.scale.copy(this.scale);
                tile.resolution.copy(this.resolution);

                tile.createInitialBounds(this.heightRange);

                //hook for building
                tile.ensureBuilt = ensureBuilt(x, y);
            }
        }

        this.bvh.insertManyBoxes2(function (index) {
            return tiles[index].boundingBox;
        }, tileCount);
    }

    /**
     *
     * @param {number} x Tile X coordinate
     * @param {number} y Tile Y coordinate
     * @returns {number}
     */
    computeTileIndex(x, y) {
        assert.ok(Number.isInteger(x), `x must be an integer, instead was ${x}`);
        assert.ok(Number.isInteger(y), `x must be an integer, instead was ${y}`);

        assert.ok(x >= 0, `x(=${x}) must be greater or equal to 0`);
        assert.ok(y >= 0, `y(=${y}) must be greater or equal to 0`);

        const w = Math.ceil(this.totalSize.x / this.tileSize.x);

        assert.ok(x < w, `x(=${x}) must be less than than width(=${w})`);
        assert.ok(y < Math.ceil(this.totalSize.y / this.tileSize.y), `y(=${y}) must be less than than height(=${Math.ceil(this.totalSize.y / this.tileSize.y)})`);

        return y * w + x;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @returns {TerrainTile}
     */
    getRaw(x, y) {

        const tileIndex = this.computeTileIndex(x, y);

        assert.ok(tileIndex >= 0, `tileIndex(=${tileIndex}) must be >= 0`);
        assert.ok(tileIndex <= this.tiles.length, `tileIndex(=${tileIndex}) must be <= tileCount(=${this.tiles.length})`);

        const tile = this.tiles[tileIndex];

        return tile;
    }

    /**
     *
     * @param {number} x Grid X coordinate
     * @param {number} y Grid Y coordinate
     * @returns {TerrainTile}
     */
    getRawTileByPosition(x, y) {
        const tileX = Math.floor(x / this.tileSize.x);
        const tileY = Math.floor(y / this.tileSize.y);

        return this.getRaw(tileX, tileY);
    }

    processTile(x, y, callback) {
        const tile = this.getRaw(x, y);

        if (tile.isBuilt) {
            callback(tile);
        } else {
            tile.onBuilt.addOne(callback);
        }
    }

    /**
     *
     * @param {int} x
     * @param {int} y
     * @returns {Promise}
     */
    obtain(x, y) {
        const tile = this.getRaw(x, y);

        if (tile === undefined) {
            throw new Error(`No tile found at x=${x},y=${y}`);
        }

        tile.referenceCount++;

        if (tile.isBuilt) {
            return Promise.resolve(tile);

        } else {
            const promise = new Promise((resolve, reject) => {
                tile.onBuilt.addOne(resolve);
                tile.onDestroyed.addOne(reject);
            });

            if (!tile.isBuildInProgress) {
                this.build(x, y, noop, noop);
            }

            return promise;
        }

    }

    /**
     *
     * @param {TerrainTile} tile
     */
    release(tile) {
        tile.referenceCount--;

        if (tile.referenceCount <= 0) {
            //potential garbage
        }

        tile.onDestroyed.send1(tile);
    }

    stitchTile(x, y, tile) {

        const gridSize = this.totalSize.clone().divide(this.tileSize).floor();

        const self = this;
        //normal stitching
        let top, bottom, left, right, topLeft, topRight, bottomLeft, bottomRight;

        if (y > 0) {
            top = self.getRaw(x, y - 1);
            if (x > 0) {
                topLeft = self.getRaw(x - 1, y - 1);
            }
            if (x < gridSize.x - 1) {
                topRight = self.getRaw(x + 1, y - 1);
            }
        }
        if (y < gridSize.y - 1) {
            bottom = self.getRaw(x, y + 1);
            if (x > 0) {
                bottomLeft = self.getRaw(x - 1, y + 1);
            }
            if (x < gridSize.x - 1) {
                bottomRight = self.getRaw(x + 1, y + 1);
            }
        }
        if (x > 0) {
            left = self.getRaw(x - 1, y);
        }
        if (x < gridSize.x - 1) {
            right = self.getRaw(x + 1, y);
        }

        tile.stitchNormals2(top, bottom, left, right, topLeft, topRight, bottomLeft, bottomRight);
    }

    /**
     *
     * @param {SurfacePoint3} result
     * @param {number} originX
     * @param {number} originY
     * @param {number} originZ
     * @param {number} directionX
     * @param {number} directionY
     * @param {number} directionZ
     * @returns {boolean}
     */
    raycastFirstSync(
        result,
        originX,
        originY,
        originZ,
        directionX,
        directionY,
        directionZ
    ) {

        raycastBVHVisitor.collector = firstRayIntersectionTerrainBVHVisitor;
        raycastBVHVisitor.setOrigin(originX, originY, originZ);
        raycastBVHVisitor.setDirection(directionX, directionY, directionZ);

        firstRayIntersectionTerrainBVHVisitor.initialize();
        firstRayIntersectionTerrainBVHVisitor.setOrigin(originX, originY, originZ);
        firstRayIntersectionTerrainBVHVisitor.setDirection(directionX, directionY, directionZ);

        traverseBinaryNodeUsingVisitor(this.bvh, raycastBVHVisitor);

        if (firstRayIntersectionTerrainBVHVisitor.closestDistance !== Number.POSITIVE_INFINITY) {
            result.copy(firstRayIntersectionTerrainBVHVisitor.closest);

            return true;
        }

        return false;
    }

    raycastVertical(x, y, successCallback, missCallback) {
        assert.typeOf(missCallback, 'function', 'missCallback');

        /**
         *
         * @param {TerrainTile} tile
         */
        function doCast(tile) {
            tile.raycastVertical(x, y, successCallback, missCallback);
        }


        let miss = true;

        this.bvh.traverseRayLeafIntersections(x, -10000, y, 0, 1, 0, function (leaf) {
            /**
             *
             * @type {TerrainTile}
             */
            const tile = leaf.object;

            miss = false;

            if (tile.isBuilt) {
                doCast(tile);
            } else {
                tile.onBuilt.addOne(doCast);
            }
        });

        if (miss) {
            missCallback();
        }
    }

    /**
     * TODO untested
     * @param {SurfacePoint3} contact
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    raycastVerticalFirstSync(contact, x, y) {

        let bestHit = null;
        let bestNormal = null;
        let bestGeometry = null;
        let bestDistanceSqr = Number.POSITIVE_INFINITY;


        v3_origin.set(x, -10000, y);
        v3_direction.set(0, 1, 0);

        /**
         *
         * @param {Vector3} hit
         * @param normal
         * @param geo
         */
        function registerHit(hit, normal, geo) {
            const d = hit.y;

            if (d < bestDistanceSqr) {
                bestDistanceSqr = d;
                bestHit = hit;
                bestNormal = normal;
                bestGeometry = geo;
            }
        }

        this.bvh.traverseRayLeafIntersections(x, -10000, y, 0, 1, 0, function (leaf) {
            const tile = leaf.object;

            if (tile.isBuilt) {
                tile.raycast(v3_origin, v3_direction, registerHit, noop);
            }
        });


        if (bestHit !== null) {
            contact.position.copy(bestHit);
            contact.normal.copy(bestNormal);
            return true;
        }

        return false;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {function} resolve
     * @param {function} reject
     */
    build(x, y, resolve, reject) {

        assert.typeOf(resolve, 'function', 'resolve');
        assert.typeOf(reject, 'function', 'reject');

        const processName = 'building tile x = ' + x + ", y = " + y;
        const self = this;


        const tileIndex = this.computeTileIndex(x, y);
        const tile = this.tiles[tileIndex];

        tile.isBuilt = false;
        tile.isBuildInProgress = true;

        this.buildWorker.buildTile(
            tile.position.toJSON(),
            tile.size.toJSON(),
            tile.scale.toJSON(),
            self.totalSize.toJSON(),
            tile.resolution.getValue()
        ).then(function (tileData) {

            //check that the tile under index is still the same tile
            if (self.tiles[tileIndex] !== tile) {
                //the original tile was destroyed
                reject('Original tile was destroyed during build process');
                return;
            }

            if (!tile.isBuildInProgress) {
                reject('Build request has been cancelled');
                return;
            }

            // console.time(processName);

            tile.build(tileData);

            self.stitchTile(x, y, tile);

            //refit the bvh
            tile.boundingBox.parentNode.bubbleRefit();

            tile.isBuilt = true;
            tile.isBuildInProgress = false;

            //invoke callbacks
            tile.onBuilt.send1(tile);

            // console.timeEnd(processName);

            self.on.tileBuilt.dispatch(tile);
        }, reject);
    }
}

const v3_origin = new Vector3();
const v3_direction = new Vector3();

const raycastBVHVisitor = new RaycastBVHVisitor();
const firstRayIntersectionTerrainBVHVisitor = new FirstRayIntersectionTerrainBVHVisitor();

export default TerrainTileManager;

