import { TerrainPaintTool } from "./TerrainPaintTool.js";
import { clamp, inverseLerp, lerp } from "../../../core/math/MathUtils.js";
import { PatchTerrainHeightAction } from "../../actions/concrete/PatchTerrainHeightAction.js";
import { QuadTreeNode } from "../../../core/geom/2d/quad-tree/QuadTreeNode.js";
import { Transform } from "../../../engine/ecs/components/Transform.js";
import TransformModifyAction from "../../actions/concrete/TransformModifyAction.js";

const LIMIT_VALUE = 1000;

export class TerrainHeightPaintTool extends TerrainPaintTool {

    constructor() {
        super();

        this.settings.limitMin = -LIMIT_VALUE;
        this.settings.limitMax = LIMIT_VALUE;

        /**
         *
         * @type {QuadTreeNode<number>}
         */
        this.transform_index = new QuadTreeNode();
    }

    buildTransformIndex() {
        /**
         *
         * @type {Engine}
         */
        const engine = this.engine;

        /**
         *
         * @type {EntityManager}
         */
        const entityManager = engine.entityManager;

        /**
         *
         * @type {EntityComponentDataset}
         */
        const dataset = entityManager.dataset;

        //purge existing data
        this.transform_index.clear();

        /**
         *
         * @type {number}
         */
        const gridScale = this.terrain.gridScale;

        const uS = 1 / (this.terrain.size.x * gridScale);
        const vS = 1 / (this.terrain.size.y * gridScale);

        dataset.traverseComponents(Transform, (transform, entity) => {
            const position = transform.position;

            const x = position.x;
            const z = position.z;

            const u = x * uS;
            const v = z * vS;

            const datum = this.transform_index.add(transform, u, v, u, v);

            datum.entity = entity;
        });
    }

    initialize() {
        super.initialize();

        this.buildTransformIndex();

    }

    shutdown() {
        super.shutdown();
    }

    /**
     *
     * @param {number} timeDelta
     */
    paint(timeDelta) {
        const power = this.settings.brushStrength * timeDelta;

        /**
         *
         * @type {Terrain}
         */
        const terrain = this.terrain;

        /**
         *
         * @type {Sampler2D}
         */
        const heightMap = terrain.samplerHeight;

        const brushPosition = this.__brushPosition;
        const brushSize = this.settings.brushSize;

        const terrainSize = terrain.size;

        const uv_x = brushPosition.x / terrainSize.x;
        const uv_y = brushPosition.y / terrainSize.y;

        const uv_w = brushSize / terrainSize.x;
        const uv_h = brushSize / terrainSize.y;

        const uv_x0 = uv_x - uv_w / 2;
        const uv_x1 = uv_x + uv_w / 2;

        const uv_y0 = uv_y - uv_h / 2;
        const uv_y1 = uv_y + uv_h / 2;

        const h_x0 = uv_x0 * heightMap.width;
        const h_x1 = uv_x1 * heightMap.width;

        const h_y0 = uv_y0 * heightMap.height;
        const h_y1 = uv_y1 * heightMap.height;

        const x0 = Math.ceil(h_x0);
        const x1 = Math.floor(h_x1);

        const y0 = Math.ceil(h_y0);
        const y1 = Math.floor(h_y1);

        const marker = this.settings.marker;

        const direction = this.modifiers.shift ? -1 : 1;

        const speed = power * direction;

        const action = new PatchTerrainHeightAction(terrain, x0, y0, (x1 - x0), (y1 - y0));

        const limitMin = this.settings.limitMin;
        const limitMax = this.settings.limitMax;

        for (let y = y0; y < y1; y++) {

            const v = inverseLerp(h_y0, h_y1, y);


            for (let x = x0; x < x1; x++) {

                const u = inverseLerp(h_x0, h_x1, x);

                //Get alpha
                const markerValue = marker.sampleChannelBilinear(u, v, 3);

                const p = markerValue / 256;

                const address = y * heightMap.width + x;

                const base = heightMap.data[address];

                const patchAddress = (y - y0) * action.patch.width + (x - x0);

                const targetValue = clamp(base + speed, limitMin, limitMax);

                if (markerValue === 0) {

                    action.patch.data[patchAddress] = base;

                } else {

                    const value = lerp(base, targetValue, p);

                    if (Number.isNaN(value)) {
                        console.warn('.');

                        action.patch.data[patchAddress] = base;

                    } else {

                        action.patch.data[patchAddress] = value;

                    }
                }
            }

        }


        this.editor.actions.do(action);

        const objectMoveActions = this.createObjectMoveActions(action);

        this.editor.actions.doMany(objectMoveActions);
    }

    /**
     *
     * @param {PatchTerrainHeightAction} action
     * @returns {Action[]}
     */
    createObjectMoveActions(action) {

        const heightSampler = this.terrain.samplerHeight;

        const x0 = action.x;
        const y0 = action.y;

        const patch = action.patch;

        const patch_width = patch.width;
        const patch_height = patch.height;

        const x1 = x0 + patch_width;
        const y1 = y0 + patch_height;


        const u0 = x0 / heightSampler.width;
        const v0 = y0 / heightSampler.height;

        const u1 = x1 / heightSampler.width;
        const v1 = y1 / heightSampler.height;

        /**
         *
         * @type {QuadTreeDatum<Transform>[]}
         */
        const leaves = [];

        /**
         *
         * @type {Action[]}
         */
        const result = [];

        const overlaps = this.transform_index.requestDatumIntersectionsRectangle(leaves, u0, v0, u1, v1);

        for (let i = 0; i < overlaps; i++) {
            const leaf = leaves[i];

            /**
             *
             * @type {Transform}
             */
            const transform = leaf.data;

            const tX = leaf.x0 * heightSampler.width;
            const tY = leaf.y0 * heightSampler.height;

            const delta = action.computeDelta(tX, tY);

            if (delta === 0) {
                continue;
            }

            const tM = new Transform();
            tM.copy(transform);
            tM.position._add(0, delta, 0);
            const a = new TransformModifyAction(leaf.entity, tM);
            result.push(a);
        }

        return result;
    }

    start() {
        super.start();

        this.editor.actions.mark('terrain height paint');
    }

}
