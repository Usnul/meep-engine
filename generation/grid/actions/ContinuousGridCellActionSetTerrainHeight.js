import { ContinuousGridCellAction } from "./ContinuousGridCellAction.js";
import { Sampler2D } from "../../../engine/graphics/texture/sampler/Sampler2D.js";
import { obtainTerrain } from "../../../../model/game/scenes/SceneUtils.js";
import { assert } from "../../../core/assert.js";
import { lerp, min2 } from "../../../core/math/MathUtils.js";
import { CellFilterConstant } from "../../filtering/CellFilterConstant.js";

export class ContinuousGridCellActionSetTerrainHeight extends ContinuousGridCellAction {
    constructor() {
        super();

        /**
         *
         * @type {Sampler2D}
         */
        this.heightSampler = null;

        /**
         * Target height
         * @type {CellFilter}
         */
        this.target = CellFilterConstant.from(0);
    }

    initialize(seed, ecd, grid) {
        super.initialize(seed, ecd, grid);

        /**
         *
         * @type {Terrain}
         */
        const terrain = obtainTerrain(ecd);

        assert.notNull(terrain, 'terrain');

        this.heightSampler = terrain.samplerHeight;


        this.target.initialize(seed);
    }

    execute(ecd, grid, x, y, rotation, strength) {

        const g_width = grid.width;
        const g_height = grid.height;

        const sampler = this.heightSampler;

        const h_width = sampler.width;
        const h_height = sampler.height;

        const scale_x = h_width / g_width;
        const scale_y = h_height / g_height;

        //convert coordinates from grid space to sampler space
        const gs_x_1 = g_width - 1;
        const gs_y_1 = g_height - 1;

        const u = x / gs_x_1;
        const v = y / gs_y_1;

        const hs_x_1 = h_width - 1;
        const hs_y_1 = h_height - 1;

        const s_x = u * hs_x_1;
        const s_y = v * hs_y_1;

        //round down to nearest integer
        const x0 = Math.floor(s_x);
        const x1 = min2(hs_x_1, Math.ceil(s_x + scale_x));

        const y0 = Math.floor(s_y);
        const y1 = min2(hs_y_1, Math.ceil(s_y + scale_y));

        for (let _y = y0; _y < y1; _y++) {
            //convert coordinates to grid space
            const _gy = (_y / hs_y_1) * gs_y_1;

            for (let _x = x0; _x < x1; _x++) {

                //convert coordinates to grid space
                const _gx = (_x / hs_x_1) * gs_x_1;

                const oldValue = sampler.readChannel(_x, _y, 0);

                const strengthValue = strength.execute(grid, _gx, _gy, rotation);

                const targetValue = this.target.execute(grid, _gx, _gy, rotation);

                const newValue = lerp(oldValue, targetValue, strengthValue);

                sampler.writeChannel(_x, _y, 0, newValue);
            }
        }

    }
}
