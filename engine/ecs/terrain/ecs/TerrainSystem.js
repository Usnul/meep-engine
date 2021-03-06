import { System } from '../../System.js';
import Terrain from './Terrain.js';
import { CameraSystem } from '../../../graphics/ecs/camera/CameraSystem.js';
import { assert } from "../../../../core/assert.js";
import { noop } from "../../../../core/function/Functions.js";

class TerrainSystem extends System {
    /**
     *
     * @param {GraphicsEngine} graphics
     * @param {AssetManager} assetManager
     * @constructor
     */
    constructor(graphics, assetManager) {
        super();

        if (graphics === undefined) {
            throw new Error('No GraphicsEngine supplied');
        }

        if (assetManager === undefined) {
            throw new Error('No AssetManager supplied');
        }


        this.graphics = graphics;

        this.componentClass = Terrain;
        this.dependencies = [Terrain];
        this.entityManager = null;
        this.assetManager = assetManager;

        this.gridScaleX = 1;
        this.gridScaleY = 1;

        /**
         *
         * @type {RenderLayer|null}
         */
        this.renderLayer = null;

        /**
         *
         * @type {BinaryNode}
         */
        this.bvh = null;
    }

    mapPointGrid2World(x, y, v3) {
        const wX = x * self.gridScaleX;
        const wY = v3.y;
        const wZ = y * self.gridScaleY;

        v3.set(wX, wY, wZ);
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;

        this.renderLayer = this.graphics.layers.create('terrain-system');

        /**
         *
         * @param {TerrainTile} tile
         * @returns {THREE.Object3D}
         */
        function extractRenderable(tile) {
            return tile.mesh;
        }

        this.renderLayer.extractRenderable = extractRenderable;

        this.bvh = this.renderLayer.bvh;

        readyCallback();
    }

    shutdown(entityManager, readyCallback, errorCallback) {
        this.graphics.layers.remove(this.renderLayer);

        readyCallback();
    }

    /**
     *
     * @param {Terrain} component
     * @param entity
     */
    link(component, entity) {
        const gridSize = component.size;
        const gridScale = component.gridScale;

        const g_w = gridSize.x;
        const g_h = gridSize.y;

        this.gridScaleX = g_w * gridScale / (g_w - 1);
        this.gridScaleY = g_h * gridScale / (g_h - 1);

        component.startBuildService();

        const bvh = component.tiles.bvh;


        //record entity for editor
        bvh.entity = entity;

        //set render layer BVH to one maintained by TilesEngine
        this.renderLayer.bvh = bvh;
    }

    /**
     *
     * @param {Terrain} component
     * @param entity
     */
    unlink(component, entity) {
        component.stopBuildService();
    }

    update(timeDelta) {
        const em = this.entityManager;
        const dataset = em.dataset;

        /**
         *
         * @param {Terrain} terrain
         */
        function visitTerrain(terrain) {
            terrain.update(timeDelta);
            //do frustum culling
            if (terrain.frustumCulled) {
                TerrainSystem.traverseVisibleTiles(dataset, terrain, function (tile, tileManager) {
                    if (!tile.isBuilt && !tile.isBuildInProgress) {
                        tileManager.build(tile.gridPosition.x, tile.gridPosition.y, noop, noop);
                    }
                });
            }
        }

        if (dataset !== null) {
            dataset.traverseComponents(Terrain, visitTerrain);
        }
    }

    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {Terrain} terrain
     * @param {function(tile:TerrainTile, tileManager:TerrainTileManager)} callback
     */
    static traverseVisibleTiles(ecd, terrain, callback) {
        assert.notEqual(terrain, null, 'terrain is null');
        assert.notEqual(terrain, undefined, 'terrain is undefined');

        const tileManager = terrain.tiles;
        if (tileManager !== undefined) {
            CameraSystem.getActiveFrustums(ecd, function (frustums) {
                tileManager.bvh.threeTraverseFrustumsIntersections(frustums, function (leafNode) {
                    const tile = leafNode.object;
                    callback(tile, tileManager);
                });
            });
        }
    }
}


export default TerrainSystem;
