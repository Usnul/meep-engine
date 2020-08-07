import { ContinuousGridCellAction } from "./ContinuousGridCellAction.js";
import Terrain from "../../../engine/ecs/terrain/ecs/Terrain.js";
import { assert } from "../../../core/assert.js";
import GridObstacle from "../../../engine/grid/components/GridObstacle.js";
import { CellFilterConstant } from "../../filtering/core/CellFilterConstant.js";

export class ContinuousGridCellActionSetTerrainObstacle extends ContinuousGridCellAction {
    constructor() {
        super();

        /**
         *
         * @type {GridObstacle}
         */
        this.obstacle = null;

        /**
         *
         * @type {CellFilter}
         */
        this.threshold = CellFilterConstant.from(0);
    }

    initialize(seed, ecd, grid) {
        super.initialize(seed, ecd, grid);


        const cp = ecd.getAnyComponent(Terrain);

        assert.notNull(cp.component, 'terrain');


        const obstacle = ecd.getComponent(cp.entity, GridObstacle);

        assert.defined(obstacle, 'obstacle');

        this.obstacle = obstacle;
    }

    execute(ecd, grid, x, y, rotation, strength) {
        const t = this.threshold.execute(grid, x, y, rotation);

        const v = strength.execute(grid, x, y, rotation);


        if (v > t) {
            this.obstacle.writePoint(x, y, 1);
        } else {
            this.obstacle.writePoint(x, y, 0);
        }

    }
}
