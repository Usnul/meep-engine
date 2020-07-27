import { MarkerNodeEmitter } from "./MarkerNodeEmitter.js";
import { assert } from "../../../core/assert.js";

export class MarkerNodeEmitterFromAction extends MarkerNodeEmitter{
    constructor() {
        super();

        /**
         *
         * @type {GridCellActionPlaceMarker[]}
         */
        this.actions = [];
    }


    /**
     *
     * @param {GridCellActionPlaceMarker[]} actions
     * @return {MarkerNodeEmitterFromAction}
     */
    static from(actions){
assert.isArray(actions,'actions');

        for (let i = 0; i < actions.length; i++) {

            const action = actions[i];
            assert.equal(action.isGridCellActionPlaceMarker, true, 'action.isGridCellActionPlaceMarker !== true');
        }

         const r = new MarkerNodeEmitterFromAction();

         r.actions = actions;

         return r;
    }

    initialize(data, seed) {
        const actions = this.actions;
        const n = actions.length;

        for (let i = 0; i < n; i++) {
            const action = actions[i];

            action.initialize(data,seed);
        }
    }


    execute(data, x, y, rotation, consumer) {
        const actions = this.actions;
        const n = actions.length;

        for (let i = 0; i < n; i++) {

            const action = actions[i];

            const node = action.buildNode(data,x,y,rotation);

            consumer.consume(node);

        }

    }
}
