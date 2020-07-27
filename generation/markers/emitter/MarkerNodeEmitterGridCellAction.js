import { GridCellAction } from "../../placement/GridCellAction.js";
import { MarkerNodeConsumerBuffer } from "./MarkerNodeConsumerBuffer.js";
import { assert } from "../../../core/assert.js";

export class MarkerNodeEmitterGridCellAction extends GridCellAction {
    constructor() {
        super();

        /**
         *
         * @type {MarkerNodeEmitter}
         */
        this.emitter = null;

        /**
         *
         * @type {MarkerNodeConsumerBuffer}
         */
        this.buffer = new MarkerNodeConsumerBuffer();
    }

    /**
     *
     * @param {MarkerNodeEmitter} emitter
     */
    static from(emitter) {
        assert.equal(emitter.isMarkerNodeEmitter, true, 'emitter.isMarkerNodeEmitter !== true');

        const r = new MarkerNodeEmitterGridCellAction();

        r.emitter = emitter;

        return r;
    }

    initialize(data, seed) {
        this.emitter.initialize(data, seed);
    }

    execute(data, x, y, rotation) {
        this.buffer.reset();

        this.emitter.execute(data, x, y, rotation, this.buffer);

        this.buffer.writeToGrid(data);
    }
}
