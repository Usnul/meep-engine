import { ContinuousGridCellAction } from "./ContinuousGridCellAction.js";
import { CellFilterLiteralFloat } from "../../filtering/numeric/CellFilterLiteralFloat.js";
import Terrain from "../../../engine/ecs/terrain/ecs/Terrain.js";
import GridPosition from "../../../engine/grid/components/GridPosition.js";
import GridObstacle from "../../../engine/grid/components/GridObstacle.js";


export class ContinuousGridCellActionWriteObstacle extends ContinuousGridCellAction {
    constructor() {
        super();
        /**
         *
         * @type {CellFilter}
         */
        this.obstacle = CellFilterLiteralFloat.from(1);

        this.threshold = 0;

        /**
         *
         * @param {GridData} grid
         * @param {EntityComponentDataset} ecd
         * @returns {{position:GridPosition, obstacle: GridObstacle}}
         */
        this.extractTarget = (grid, ecd) => {
            const c = ecd.getAnyComponent(Terrain);

            const position = ecd.getComponent(c.entity, GridPosition);

            const obstacle = ecd.getComponent(c.entity, GridObstacle);

            return {
                position,
                obstacle
            };
        };

        /**
         *
         * @type {GridPosition}
         */
        this.targetGridPosition = null;
        /**
         *
         * @type {GridObstacle}
         */
        this.targetGridObstacle = null;
    }

    /**
     *
     * @param {CellFilter} obstacle
     * @param {number} threshold
     * @param {function} extract
     * @return {ContinuousGridCellActionWriteObstacle}
     */
    static from({ obstacle, threshold = 0, extract = undefined }) {
        const r = new ContinuousGridCellActionWriteObstacle();

        r.obstacle = obstacle;
        r.threshold = threshold;

        if (extract !== undefined) {
            r.extractTarget = extract;
        }

        return r;
    }

    initialize(seed, ecd, grid) {
        super.initialize(seed, ecd, grid);

        const target = this.extractTarget(grid, ecd);

        const obstacle = target.obstacle;
        const position = target.position;

        if (obstacle === undefined) {
            throw new Error(`Obstacle not set`);
        }

        if (position === undefined) {
            throw new Error(`Position not set`);
        }

        this.targetGridObstacle = obstacle;
        this.targetGridPosition = position;


        //initialize obstacle filter
        if (!this.obstacle.initialized) {
            this.obstacle.initialize(grid, seed);
        }
    }

    execute(ecd, grid, x, y, rotation, strength) {
        //get index of the obstacle cell
        const tp = this.targetGridPosition;

        const local_x = x - tp.x;
        const local_y = y - tp.y;

        if (local_x < 0 || local_y < 0) {
            // out of bounds
            return;
        }

        const to = this.targetGridObstacle;

        if (local_x >= to.size.x || local_y >= to.size.y) {
            // out of bounds
            return;
        }

        const v = this.obstacle.execute(grid, x, y, rotation);


        const isObstacle = v > this.threshold;


        to.writePoint(x, y, isObstacle ? 1 : 0);
    }
}
