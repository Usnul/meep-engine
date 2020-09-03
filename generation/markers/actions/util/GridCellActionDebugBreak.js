import { GridCellAction } from "../../../placement/action/GridCellAction.js";
import { returnTrue } from "../../../../core/function/Functions.js";

export class GridCellActionDebugBreak extends GridCellAction {
    constructor() {
        super();

        /**
         *
         * @type {function():boolean}
         */
        this.condition = returnTrue;
    }

    static from({ condition = returnTrue }) {
        const r = new GridCellActionDebugBreak();

        r.condition = condition;

        return r;
    }

    execute(data, x, y, rotation) {
        if (this.condition(data, x, y, rotation)) {
            debugger;
        }
    }
}
