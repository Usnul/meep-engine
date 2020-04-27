import { TerrainPaintTool } from "./TerrainPaintTool.js";
import Vector4 from "../../../core/geom/Vector4.js";
import { clamp, inverseLerp, lerp } from "../../../core/math/MathUtils.js";
import { PatchTerrainHeightAction } from "../../actions/concrete/PatchTerrainHeightAction.js";

const LIMIT_VALUE = 1000;

export class TerrainHeightPaintTool extends TerrainPaintTool {

    constructor() {
        super();

        this.settings.limitMin = -LIMIT_VALUE;
        this.settings.limitMax = LIMIT_VALUE;
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

        const markerSample = new Vector4();

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

                marker.sample(u, v, markerSample);

                const markerValue = markerSample.w;

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
    }

    /**
     *
     * @param {PatchTerrainHeightAction} action
     * @returns {Action[]}
     */
    createObjectMoveActions(action) {

    }

    start() {
        super.start();

        this.editor.actions.mark('terrain height paint');
    }

}
