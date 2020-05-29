import { TerrainPaintTool } from "./TerrainPaintTool.js";
import { clamp, inverseLerp } from "../../../core/math/MathUtils.js";
import { Sampler2D } from "../../../engine/graphics/texture/sampler/Sampler2D.js";
import { PatchTerrainTextureAction } from "../../actions/concrete/PatchTerrainTextureAction.js";
import { convertSampler2D2DataURL } from "../../../engine/graphics/texture/sampler/convertSampler2D2DataURL.js";
import { obtainTerrain } from "../../../../model/game/scenes/SceneUtils.js";

export class TerrainTexturePaintTool extends TerrainPaintTool {
    constructor() {
        super();

        this.name = "texture-paint-terrain";

        /**
         *
         * @type {number}
         */
        this.settings.splatIndex = 0;

        /**
         *
         * @type {Float32Array}
         * @private
         */
        this.__splatMapScratch = new Float32Array(0);

        this.__iconLayer = null;
    }


    updateIcon(editor) {

        /**
         *
         * @type {Terrain}
         */
        const terrain = obtainTerrain(editor.engine.entityManager.dataset);

        /**
         *
         * @type {TerrainLayer}
         */
        const layer = terrain.layers.get(this.settings.splatIndex);

        if (layer === this.__iconLayer) {
            return;
        }

        this.__iconLayer = layer;

        this.buildIcon(terrain);
    }

    /**
     *
     * @param {Terrain} terrain
     */
    buildIcon(terrain) {

        /**
         *
         * @type {TerrainLayer}
         */
        const layer = terrain.layers.get(this.settings.splatIndex);


        const url = convertSampler2D2DataURL(layer.diffuse);

        this.icon.set(url);
    }

    initialize() {
        super.initialize();
    }

    shutdown() {
        super.shutdown();
    }

    paint(timeDelta) {

        const power = this.settings.brushStrength * timeDelta;

        /**
         *
         * @type {Terrain}
         */
        const terrain = this.terrain;

        const brushPosition = this.__brushPosition;
        const brushSize = this.settings.brushSize;


        const terrainSize = terrain.size;

        const terrainHeight = terrainSize.y;
        const terrainWidth = terrainSize.x;

        const uv_x = brushPosition.x / terrainWidth;
        const uv_y = brushPosition.y / terrainHeight;

        const uv_w = brushSize / terrainWidth;
        const uv_h = brushSize / terrainHeight;

        const uv_x0 = uv_x - uv_w / 2;
        const uv_x1 = uv_x + uv_w / 2;

        const uv_y0 = uv_y - uv_h / 2;
        const uv_y1 = uv_y + uv_h / 2;

        const marker = this.settings.marker;

        const direction = this.modifiers.shift ? -1 : 1;

        const speed = power * direction;

        /**
         *
         * @type {Float32Array}
         */
        const weightData = this.__splatMapScratch;


        /**
         *
         * @type {SplatMapping}
         */
        const splat = terrain.splat;

        const splatDepth = splat.depth;
        const splatWidth = splat.size.x;
        const splatHeight = splat.size.y;

        const splatLayerSize = splatWidth * splatHeight;

        const h_x0 = uv_x0 * splatWidth;
        const h_x1 = uv_x1 * splatWidth;

        const h_y0 = uv_y0 * splatHeight;
        const h_y1 = uv_y1 * splatHeight;

        const x0 = Math.ceil(h_x0);
        const x1 = Math.floor(h_x1);

        const y0 = Math.ceil(h_y0);
        const y1 = Math.floor(h_y1);

        const splatIndex = this.settings.splatIndex;

        /**
         *
         * @type {Sampler2D}
         */
        const materialSampler = splat.materialSampler;

        //create action
        const patchWidth = x1 - x0;
        const patchHeight = y1 - y0;

        const targetSplatLayerAddress = splatIndex * splatLayerSize;

        const action = new PatchTerrainTextureAction(terrain, x0, y0, patchWidth, patchHeight);
        action.patchMaterial.copy_sameItemSize(materialSampler, x0, y0, 0, 0, patchWidth, patchHeight);

        const patchMaterialData = action.patchMaterial.data;

        const a4_weight = new Array(4);
        const a4_material = new Array(4);

        for (let y = y0; y < y1; y++) {

            const v = inverseLerp(h_y0, h_y1, y);

            for (let x = x0; x < x1; x++) {

                const u = inverseLerp(h_x0, h_x1, x);

                const markerValue = marker.sampleChannelBilinearUV(u, v, 3);

                if (Number.isNaN(markerValue)) {
                    continue;
                }

                //write weight
                const splatTexelIndex = y * splatWidth + x;

                const baseValue = weightData[targetSplatLayerAddress + splatTexelIndex];

                const delta = markerValue * speed;

                const value = baseValue + delta;

                const clampedValue = clamp(value, 0, 255);

                if (Number.isNaN(clampedValue)) {

                    continue;
                }


                //write new weight for the material
                weightData[targetSplatLayerAddress + splatTexelIndex] = clampedValue;


                for (let i = 0; i < splatDepth; i++) {

                    if (i === splatIndex) {
                        continue;
                    }

                    const address = i * splatLayerSize + splatTexelIndex;

                    const v = weightData[address];

                    const cV = clamp(v - delta, 0, 255);

                    weightData[address] = cV;

                }

                a4_weight.fill(-1);
                a4_material.fill(255);

                //compute materials
                for (let i = 0; i < splatDepth; i++) {

                    const address = i * splatLayerSize + splatTexelIndex;

                    const weight = weightData[address];

                    if (weight > a4_weight[3]) {
                        a4_weight[3] = weight;
                        a4_material[3] = i;

                        for (let j = 3; j >= 0 && weight > a4_weight[j - 1]; j--) {
                            const tW = a4_weight[j];
                            const tM = a4_material[j];

                            const j1 = j - 1;

                            a4_weight[j] = a4_weight[j1];
                            a4_material[j] = a4_material[j1];

                            a4_weight[j1] = tW;
                            a4_material[j1] = tM;
                        }

                    }


                }

                const patchIndex4 = ((y - y0) * patchWidth + (x - x0)) * 4;

                patchMaterialData[patchIndex4] = a4_material[0];
                patchMaterialData[patchIndex4 + 1] = a4_material[1];
                patchMaterialData[patchIndex4 + 2] = a4_material[2];
                patchMaterialData[patchIndex4 + 3] = a4_material[3];
            }

        }


        action.readWeights(this.__splatMapScratch, splatWidth, splatHeight);

        this.editor.actions.do(action);
    }

    start() {
        super.start();

        /**
         *
         * @type {Terrain}
         */
        const terrain = this.terrain;

        const splat = terrain.splat;

        const weightData = splat.weightData;

        /**
         *
         * @type {Float32Array}
         */
        this.__splatMapScratch = new Float32Array(weightData);

        this.editor.actions.mark('paint terrain texture');
    }
}
