/**
 * Created by Alex on 28/10/2014.
 */


import {
    ClampToEdgeWrapping,
    DataTexture,
    FloatType,
    LinearFilter,
    NearestFilter,
    RedFormat,
    UnsignedByteType,
    Vector2 as ThreeVector2
} from 'three';
import { Sampler2D } from '../../../graphics/texture/sampler/Sampler2D.js';
import heightMap2NormalMap from '../../grid/HeightMap2NormalMap.js';
import normalMap2AOMap from '../../grid/NormalMap2AOMap.js';
import rgbaData2valueSampler2D from '../../../graphics/texture/sampler/rgbaData2valueSampler2D.js';
import { BinaryNode } from '../../../../core/bvh2/BinaryNode.js';
import Vector2 from '../../../../core/geom/Vector2.js';
import Vector3 from '../../../../core/geom/Vector3.js';
import TerrainOverlay from '../TerrainOverlay.js';

import Clouds from '../TerrainClouds.js';

import TerrainTileManager from '../tiles/TerrainTileManager.js';
import { WebGLRendererPool } from "../../../graphics/render/RendererPool.js";
import { deserializeTexture } from "../../../graphics/texture/sampler/TextureBinaryBufferSerializer.js";
import { BinaryBuffer } from "../../../../core/binary/BinaryBuffer.js";
import { TerrainPreview } from "../TerrainPreview.js";
import { assert } from "../../../../core/assert.js";
import { GameAssetType } from "../../../asset/GameAssetType.js";
import { writeSample2DDataToDataTexture } from "../../../graphics/texture/sampler/writeSampler2DDataToDataTexture.js";
import { TerrainLayers } from "./layers/TerrainLayers.js";
import { SplatMaterial } from "../../../graphics/material/SplatMaterial.js";
import { loadLegacyTerrainSplats, SplatMapping } from "./splat/SplatMapping.js";
import { OffsetScaleTransform2D } from "./OffsetScaleTransform2D.js";
import { GridTransformKind } from "./GridTransformKind.js";
import { clamp } from "../../../../core/math/MathUtils.js";
import { makeTerrainWorkerProxy } from "./makeTerrainWorkerProxy.js";
import { MeepSettings } from "../../../MeepSettings.js";
import { loadLegacyTerrainLayers } from "./layers/loadLegacyTerrainLayers.js";

/**
 *
 * @param zRange
 * @param heightMapURL
 * @param {AssetManager} assetManager
 * @returns {Promise<any>}
 */
function promiseSamplerHeight(zRange, heightMapURL, assetManager) {
    return new Promise(function (fulfill, reject) {

        function assetObtained(asset) {
            const array = asset.create();

            const binaryBuffer = new BinaryBuffer();
            //
            // binaryBuffer.writeUint32(2560);
            // binaryBuffer.writeUint32(2560);
            //
            // binaryBuffer.writeUint8(1);
            //
            // binaryBuffer.writeUint8(6);

            binaryBuffer.writeBytes(new Uint8Array(array), 0, array.length);

            binaryBuffer.position = 0;

            const sampler2D = deserializeTexture(binaryBuffer);
            fulfill(sampler2D);
        }


        if (heightMapURL === undefined) {
            console.warn('Height map is not specified');
            const defaultSampler = new Sampler2D(new Uint8Array(1), 1, 1, 1);
            fulfill(defaultSampler);
        } else if (heightMapURL.endsWith('.bin')) {
            //load texture from a binary file
            assetManager.get(heightMapURL, GameAssetType.ArrayBuffer, assetObtained, reject);
        } else {
            assetManager.get(heightMapURL, GameAssetType.Image, function (asset) {
                const image = asset.create();

                // plane
                const imgWidth = image.width;
                const imgHeight = image.height;

                const samplerHeight = rgbaData2valueSampler2D(image.data, imgWidth, imgHeight, zRange, -zRange / 2);

                fulfill(samplerHeight);
            }, reject);
        }
    });
}

/**
 *
 * @param {WebGLRenderer} renderer
 * @param {Sampler2D} sampler
 * @returns {Promise<Sampler2D>}
 */
function promiseSamplerNormal(renderer, sampler) {

    console.time("generating normal map");
    const normalSampler = heightMap2NormalMap(renderer, sampler);
    console.timeEnd("generating normal map");


    return Promise.resolve(normalSampler);
}

/**
 *
 * @param {WebGLRenderer} renderer
 * @param {Promise<Sampler2D>} pSamplerNormal
 * @param {Sampler2D} samplerHeight
 * @param {Vector2} resolution
 * @param {number} rayLength
 * @returns {Promise<unknown>}
 */
function promiseSamplerAO(
    renderer,
    pSamplerNormal,
    samplerHeight,
    resolution,
    rayLength
) {
    return new Promise(function (resolve, reject) {
        Promise.all([pSamplerNormal]).then(function (values) {
            const samplerNormal = values[0];
            console.time("generating AO map");
            const occlusionSampler = normalMap2AOMap(
                renderer,
                samplerHeight,
                samplerNormal,
                resolution,
                rayLength
            );
            console.timeEnd("generating AO map");
            //console.info(occlusionSampler);
            //
            // paintSamplerOnHTML(samplerHeight, 0, 0, 40, 3);
            // paintSamplerOnHTML(samplerNormal, 1, 0, 128, 1);
            // paintSamplerOnHTML(occlusionSampler, 2, 0, 1, 0);
            //
            //
            resolve(occlusionSampler);
        }, reject);
    });
}

/**
 *
 * @param {DataTexture} texture
 * @param {Vector2} resolution
 * @param {Sampler2D} heightSampler
 * @param {number} heightRange
 * @param {number} [rayLength]
 * @returns {Promise}
 */
function buildLightTexture({ texture, heightSampler, resolution, rayLength = 17 }) {

    const renderer = WebGLRendererPool.global.get();

    if (resolution === undefined) {
        resolution = new Vector2(texture.image.width, texture.image.height);
    }

    const normal = promiseSamplerNormal(renderer, heightSampler);
    const ao = promiseSamplerAO(renderer, normal, heightSampler, resolution, rayLength);

    const promise = ao.then(sampler => {
        writeSample2DDataToDataTexture(sampler, texture);
    });

    Promise.all([normal, ao]).finally(() => {
        WebGLRendererPool.global.release(renderer);
    });

    return promise;
}

let idCounter = 0;

class Terrain {
    constructor() {
        /**
         *
         * @type {number}
         */
        this.id = idCounter++;

        /**
         *
         * @type {number}
         */
        this.gridScale = 1;

        /**
         * Transform from grid coordinate system to world coordinate system
         * @type {OffsetScaleTransform2D}
         */
        this.gridTransform = new OffsetScaleTransform2D();

        /**
         *
         * @type {number}
         */
        this.gridTransformKind = GridTransformKind.Direct;

        /**
         * Number of geometric subdivisions per single terrain tile
         * @example if value is set to 4, each tile will be split into 4x4 quads
         * @type {number}
         */
        this.resolution = 4;

        /**
         *
         * @type {Vector2}
         */
        this.size = new Vector2(0, 0);
        /**
         *
         * @type {TerrainPreview}
         */
        this.preview = new TerrainPreview();

        /**
         *
         * @type {Clouds}
         */
        this.clouds = new Clouds();
        this.clouds.enabled = true;

        /**
         * @deprecated
         * @type {String}
         */
        this.heightMapURL = null;

        /**
         * @deprecated
         * @type {number}
         */
        this.heightRange = 0;

        /**
         *
         * @type {SplatMapping}
         */
        this.splat = new SplatMapping();

        /**
         *
         * @type {Sampler2D}
         */
        this.samplerHeight = Sampler2D.float32(1, 1, 1);

        /**
         *
         * @type {DataTexture}
         */
        this.heightTexture = new DataTexture(this.samplerHeight.data, this.samplerHeight.width, this.samplerHeight, RedFormat, FloatType);

        this.heightTexture.wrapS = ClampToEdgeWrapping;
        this.heightTexture.wrapT = ClampToEdgeWrapping;

        this.heightTexture.generateMipmaps = false;

        this.heightTexture.minFilter = LinearFilter;
        this.heightTexture.magFilter = NearestFilter;

        this.heightTexture.flipY = false;

        this.heightTexture.internalFormat = 'R32F';


        /**
         *
         * @type {TerrainLayers}
         */
        this.layers = new TerrainLayers();

        /**
         * @type {ShaderMaterial}
         */
        this.material = new SplatMaterial({});

        /**
         * whether or not frustum culling is enabled
         * @type {boolean}
         */
        this.frustumCulled = true;


        /**
         *
         * @type {TerrainOverlay}
         */
        this.overlay = new TerrainOverlay(this.size);

        /**
         *
         * @type {BinaryNode}
         */
        this.bvh = new BinaryNode();

        /**
         *
         * @type {WorkerProxy}
         */
        this.buildWorker = makeTerrainWorkerProxy();

        this.tiles = new TerrainTileManager({
            material: this.material,
            buildWorker: this.buildWorker
        });

        this.tiles.tileSize.set(TILE_SIZE, TILE_SIZE);

        this.tiles.material.set(this.material);

        /**
         *
         * @type {AssetManager}
         * @private
         */
        this.__assetManager = null;

        /**
         * Represents legacy material specification before April 2020 terrain model rework
         * @type {Object}
         * @deprecated
         * @private
         */
        this.__legacyMaterialSpec = null;

        /**
         *
         * @type {String}
         * @private
         * @deprecated
         */
        this.__legacyHeightSamplerURL = null;

        /**
         *
         * @type {String}
         */
        this.lightMapURL = null;

        this.initialize();
    }

    initialize() {
        const overlay = this.overlay;

        const uniforms = this.material.uniforms;

        uniforms.diffuseGridOverlayMap.value = overlay.texture;
        uniforms.gridBorderWidth.value = overlay.borderWidth.getValue();

        const size = this.size;

        overlay.size.onChanged.add(function (x, y) {
            uniforms.gridResolution.value = new ThreeVector2(size.x, size.y);
        });

        overlay.borderWidth.onChanged.add(function (v) {
            uniforms.gridBorderWidth.value = v;
        });

        overlay.tileImage.onChanged.add(this.updateTileImage, this);


        this.clouds.addMaterial(this.material);
    }

    updateTileImage() {
        const tileImageURL = this.overlay.tileImage.getValue();

        const assetManager = this.__assetManager;

        if (assetManager === null) {
            return;
        }

        assetManager.promise(tileImageURL, GameAssetType.Texture)
            .then((asset) => {

                if (tileImageURL !== this.overlay.tileImage.getValue()) {
                    //url has changed, abort
                    return;
                }

                /**
                 *
                 * @type {Texture}
                 */
                const texture = asset.create();

                texture.minFilter = LinearFilter;
                texture.magFilter = LinearFilter;

                texture.generateMipmaps = false;

                this.material.uniforms.diffuseGridOverlaySprite.value = texture;
            });
    }

    update(timeDelta) {
        this.clouds.update(timeDelta);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {function} callback
     * @param {function} missCallback
     * @param {function} errorCallback
     */
    sampleHeight(x, y, callback, missCallback, errorCallback) {
        assert.typeOf(callback, 'function', 'callback');
        assert.typeOf(missCallback, 'function', 'missCallback');
        assert.typeOf(errorCallback, 'function', 'errorCallback');

        let processed = false;

        /**
         *
         * @param {Vector3} hit
         * @param face
         * @param geometry
         */
        function processHit(hit, face, geometry) {
            if (!processed) {
                processed = true;
                callback(hit.y);
            }
        }

        this.raycastVertical(x, y, processHit, missCallback, errorCallback);
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
    raycastFirstSync(result, originX, originY, originZ, directionX, directionY, directionZ) {
        if (this.tiles === undefined) {
            return false;
        }

        return this.tiles.raycastFirstSync(result, originX, originY, originZ, directionX, directionY, directionZ);
    }

    /**
     *
     * @param {Vector3} origin
     * @param {Vector3} direction
     * @param {function(hit:Vector3, normal:Vector3, geometry:BufferGeometry)} callback
     * @param {function} missCallback
     */
    raycast(origin, direction, callback, missCallback) {
        /**
         *
         * @param {TerrainTileManager} tiles
         */
        function rayCast(tiles) {
            tiles.raycast(origin, direction, callback, missCallback);
        }

        if (this.tiles !== undefined) {
            rayCast(this.tiles);
        } else {
            this.pTiles.then(rayCast);
        }
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {function} callback
     * @param {function} missCallback
     * @param {function} errorCallback
     */
    raycastVertical(x, y, callback, missCallback, errorCallback) {
        assert.typeOf(callback, 'function', 'callback');
        assert.typeOf(missCallback, 'function', 'missCallback');
        assert.typeOf(errorCallback, 'function', 'errorCallback');

        this.pTiles.then(function (tiles) {
            tiles.raycastVertical(x, y, callback, missCallback);
        }, errorCallback);
    }

    /**
     *
     * @param {SurfacePoint3} contact
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    raycastVerticalFirstSync(contact, x, y) {
        if (this.tiles === undefined) {
            //tiles don't exist
            return false;
        }

        return this.tiles.raycastVerticalFirstSync(contact, x, y);
    }

    /**
     *
     * @param {Array.<Vector3>} points3v points in world coordinate space
     * @param {function} callback
     * @param {function} errorCallback
     */
    projectPointsVertical(points3v, callback, errorCallback) {
        /**
         *
         * @type {Terrain}
         */
        const terrain = this;

        let mappedCount = 0;

        const l = points3v.length;

        const missedPoints = [];

        function finalizePoint() {
            if (++mappedCount >= l) {
                mendMissedPoints(points3v, missedPoints);
                callback(points3v);
            }
        }


        function mapPoint(index) {
            const p = points3v[index];

            function missedCallback() {
                //no mapping
                missedPoints.push(index);

                finalizePoint();
            }

            function hitCallback(y) {
                p.y = y;

                finalizePoint();
            }

            terrain.sampleHeight(p.x, p.z, hitCallback, missedCallback, errorCallback);
        }

        if (l === 0) {
            callback(points3v);
        } else {
            for (let i = 0; i < l; i++) {
                mapPoint(i);
            }
        }
    }

    /**
     *
     * @param {Array.<Vector2>} points2v
     * @param {Vector3[]} result
     * @param {function} callback
     * @param {function} errorCallback
     */
    mapGridPoints(points2v, result, callback, errorCallback) {
        const terrain = this;

        const pointCount = points2v.length;

        for (let i = 0; i < pointCount; i++) {
            const v2 = points2v[i];

            const v3 = result[i];

            terrain.mapPointGrid2World(v2.x, v2.y, v3);
        }

        this.projectPointsVertical(result, callback, errorCallback);
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {Vector3} result
     */
    mapPointGrid2World(x, y, result) {
        assert.typeOf(x, "number", 'x');
        assert.typeOf(y, "number", 'y');

        assert.notEqual(result, null, 'result is null');
        assert.notEqual(result, undefined, 'result is undefined');
        assert.ok(result.isVector3, 'result is not Vector3');

        const transform = this.gridTransform;

        const _x = x * transform.scale_x + transform.offset_x;
        const _z = y * transform.scale_y + transform.offset_y;

        result.set(_x, result.y, _z);
    }

    /**
     *
     * @param {Vector3} v3
     * @param {Vector2} result
     */
    mapPointWorld2Grid(v3, result) {
        const transform = this.gridTransform;

        const x = (v3.x - transform.offset_x) / transform.scale_x;
        const y = (v3.z - transform.offset_y) / transform.scale_y;

        result.set(x, y);
    }

    /**
     *
     * @param opt
     * @param {TerrainSystem} terrainSystem
     */
    fromJSON(opt, terrainSystem) {
        if (opt === undefined) {
            opt = {};
        }

        if (opt.preview !== undefined) {
            this.preview.fromJSON(opt.preview);
        }

        /**
         * Assumes lowest and highest points to be at the distance equal to half the range from 0
         * @type {number}
         */
        this.heightRange = opt.heightMapRange;

        this.resolution = opt.resolution !== undefined ? opt.resolution : 4;

        const size = this.size;

        if (opt.size !== undefined) {
            size.fromJSON(opt.size);
        }

        this.gridScale = opt.scale !== undefined ? opt.scale : 2;
        //

        this.heightMapURL = opt.heightMap;
        this.materialDesc = opt.material;


        // debugSamplers(this);
        this.build(terrainSystem.assetManager);
    }

    /**
     *
     * @return {Promise}
     */
    promiseAllTiles() {
        /**
         *
         * @type {TerrainTileManager}
         */
        const tiles = this.tiles;

        const promisedTiles = [];

        tiles.traverse(function (tile) {
            const x = tile.gridPosition.x;
            const y = tile.gridPosition.y;

            const tilePromise = tiles.obtain(x, y);

            promisedTiles.push(tilePromise);
        });

        //promise all tiles
        return Promise.all(promisedTiles);
    }

    /**
     * @deprecated use {@link #samplerHeight} instead
     * @param {Sampler2D} v
     */
    set heightMap(v) {
        this.samplerHeight = v;
        this.updateHeightTexture();

        console.warn('Deprecated');
    }

    /**
     * @deprecated use {@link #samplerHeight} instead
     * @return {Sampler2D}
     */
    get heightMap() {
        return this.samplerHeight;
    }

    updateMaterial() {

        this.material.uniforms.diffuseMaps.value = this.layers.texture;

        this.material.uniforms.splatWeightMap.value = this.splat.weightTexture;

        this.material.uniforms.splatLayerCount.value = this.layers.count();

        this.material.uniforms.materialScalesMap.value = this.layers.scalesTexture;

        this.material.uniforms.splatResolution.value.set(this.splat.size.x, this.splat.size.y);
        this.material.uniforms.gridResolution.value.set(this.size.x, this.size.y);

        this.material.uniforms.uGridTransform.value.set(
            this.gridTransform.scale_x,
            this.gridTransform.scale_y,
            this.gridTransform.offset_x,
            this.gridTransform.offset_y
        );

        this.layers.updateLayerScales(this.size.x * this.gridScale, this.size.y * this.gridScale);
    }

    updateHeightTexture() {
        const sampler = this.samplerHeight;
        const texture = this.heightTexture;

        const image = texture.image;

        image.data = sampler.data;
        image.width = sampler.width;
        image.height = sampler.height;
    }

    /**
     *
     * @param {AssetManager} assetManager
     */
    buildFromLegacy(assetManager) {
        const pSamplerHeight = promiseSamplerHeight(this.heightRange, this.__legacyHeightSamplerURL, assetManager);

        const material = this.__legacyMaterialSpec;

        const pLayers = loadLegacyTerrainLayers(material, this.layers, assetManager, this.size, this.gridScale);
        const pSplats = loadLegacyTerrainSplats(material, this.splat, assetManager);

        Promise.all([pLayers, pSplats])
            .then(() => {
                this.updateMaterial();
            });

        pSamplerHeight.then((sampler) => {
            this.samplerHeight = sampler;
            this.updateHeightTexture();

            this.updateWorkerHeights();
        });

    }

    startBuildService() {
        this.buildWorker.start();
        this.updateWorkerHeights();
    }

    updateWorkerHeights() {
        const s = this.samplerHeight;
        this.buildWorker.setHeightSampler(s.data, s.itemSize, s.width, s.height);
    }

    stopBuildService() {
        this.buildWorker.stop();
    }

    buildGridTransform() {
        if (this.gridTransformKind === GridTransformKind.Legacy) {
            this.gridTransform.scale_x = (this.size.x / (this.size.x - 1)) * this.gridScale;
            this.gridTransform.scale_y = (this.size.y / (this.size.y - 1)) * this.gridScale;

            this.gridTransform.offset_x = 0;
            this.gridTransform.offset_y = 0;

        } else if (this.gridTransformKind === GridTransformKind.Direct) {
            this.gridTransform.scale_x = this.gridScale;
            this.gridTransform.scale_y = this.gridScale;

            this.gridTransform.offset_x = this.gridScale / 2;
            this.gridTransform.offset_y = this.gridScale / 2;
        }
    }

    /**
     *
     * @param {AssetManager} assetManager
     */
    build(assetManager) {

        assert.defined(assetManager, 'assetManager');
        assert.notNull(assetManager, 'assetManager');
        assert.equal(assetManager.isAssetManager, true, '.isAssetManager !== true');

        this.__assetManager = assetManager;

        this.buildGridTransform();

        this.bvh.reset();
        this.bvh.setNegativelyInfiniteBounds();
        //
        this.overlay.size.copy(this.size);

        this.overlay.tileImage.set(MeepSettings.ecs.Terrain['tile-decal']);

        this.tiles.totalSize.copy(this.size);
        this.tiles.scale.set(this.gridScale, this.gridScale);
        this.tiles.resolution.set(this.resolution);
        this.tiles.heightRange = this.heightRange;

        if (this.__legacyMaterialSpec !== null) {
            this.buildFromLegacy(assetManager);
        } else {
            //modern build path
            this.updateHeightTexture();

            this.updateWorkerHeights();

            this.layers.buildTexture();

            this.layers.loadTextureData(assetManager);
        }

        if (this.lightMapURL !== null) {
            this.material.aoMap = true;
            this.material.needsUpdate = true;

            assetManager.promise(this.lightMapURL, GameAssetType.Texture).then(asset => {
                this.material.uniforms.aoMap.value = asset.create();
                this.material.uniforms.aoMapIntensity.value = 0.7;
            });
        }

        /**
         *
         * @type {Promise<ShaderMaterial>}
         * @deprecated
         */
        this.pMaterial = Promise.resolve(this.material);

        /**
         *
         * @type {Promise<TerrainTileManager>}
         * @deprecated
         */
        this.pTiles = Promise.resolve(this.tiles);

        this.tiles.initialize();

        this.updateMaterial();

        this.updateTileImage();
    }

    buildLightMap() {


        const size_x = this.size.x;
        const size_y = this.size.y;

        const light_texture_width = clamp(size_x, 16, 2048);
        const light_texture_height = clamp(size_y, 16, 2048);

        const textureData = new Uint8Array(light_texture_width * light_texture_height);
        const texture = new DataTexture(textureData, light_texture_width, light_texture_height, RedFormat, UnsignedByteType);

        texture.wrapT = ClampToEdgeWrapping;
        texture.wrapS = ClampToEdgeWrapping;

        texture.minFilter = NearestFilter;
        texture.magFilter = LinearFilter;

        texture.flipY = false;
        texture.anisotropy = 4;

        const promise = buildLightTexture({
            texture,
            heightSampler: this.samplerHeight
        });

        const result = promise.then(() => {

            this.material.aoMap = true;
            this.material.needsUpdate = true;

            this.material.uniforms.aoMap.value = texture;
            this.material.uniforms.aoMapIntensity.value = 0.7;

            return texture;
        });

        return result;
    }

    toJSON() {
        return {
            size: this.size.toJSON(),
            heightMapRange: this.heightRange,
            scale: this.gridScale,
            resolution: this.resolution,
            heightMap: this.heightMapURL,
            material: this.materialDesc,
            preview: this.preview.toJSON()
        };
    }
}

Terrain.typeName = "Terrain";

/**
 *
 * @param {Vector3[]} points
 * @param {number[]} missIndices
 */
function mendMissedPoints(points, missIndices) {
    const numPoints = points.length;
    const lastPointIndex = numPoints - 1;

    const numMisses = missIndices.length;

    for (let i = 0; i < numMisses; i++) {
        const index = missIndices[i];

        let heightSum = 0;
        let sampleCount = 0;

        if (index > 0) {
            heightSum += points[index - 1].y;
            sampleCount++;
        }

        if (index < lastPointIndex) {
            heightSum += points[index + 1].y;
            sampleCount++;
        }

        if (sampleCount > 0) {
            points[index].y = heightSum / sampleCount;
        }
    }
}


const TILE_SIZE = 7;

export default Terrain;

