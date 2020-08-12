import { GridCellAction } from "../GridCellAction.js";
import { assert } from "../../../../core/assert.js";

/**
 * Wrapper around multiple actions
 */
export class GridCellActionSequence extends GridCellAction {
    constructor() {
        super();

        /**
         *
         * @type {GridCellAction[]}
         */
        this.elements = [];
    }

    /**
     *
     * @param {GridCellAction[]} sequence
     * @returns {GridCellActionSequence}
     */
    static from(sequence) {
        assert.defined(sequence, 'sequence');

        const r = new GridCellActionSequence();

        r.elements = sequence;

        return r;
    }

    initialize(data, seed) {
        const elements = this.elements;

        const n = elements.length;

        for (let i = 0; i < n; i++) {
            const action = elements[i];

            action.initialize(data, seed);
        }
    }

    execute(data, x, y, rotation) {


        const actions = this.elements;
        const n = actions.length;

        for (let i = 0; i < n; i++) {

            const action = actions[i];

            action.execute(data, x, y, rotation);
        }
    }
}
