import { GridCellAction } from "../../../placement/GridCellAction.js";

export class GridCellActionLogToConsole extends GridCellAction {
    constructor() {
        super();

        this.message = ``;
    }

    static from(message) {
        const r = new GridCellActionLogToConsole();

        r.message = message;

        return r;
    }

    execute(data, x, y, rotation) {
        console.log(x, y, rotation, this.message);
    }
}
