import { CellFilter } from "./CellFilter.js";

export class CellFilterDistanceToStart extends CellFilter {

    execute(grid, x, y, rotation) {
        const _x = x | 0;
        const _y = y | 0;

        const index = _x + _y * grid.width;

        const startDistances = grid.startDistances;

        return startDistances[index];
    }
}
