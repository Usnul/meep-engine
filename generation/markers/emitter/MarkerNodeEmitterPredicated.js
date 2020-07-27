import { MarkerNodeEmitter } from "./MarkerNodeEmitter.js";
import { MarkerNodeConsumerBuffer } from "./MarkerNodeConsumerBuffer.js";
import { GridDataNodePredicateAny } from "../predicate/GridDataNodePredicateAny.js";
import { assert } from "../../../core/assert.js";

export class MarkerNodeEmitterPredicated extends MarkerNodeEmitter {
    constructor() {
        super();

        /**
         *
         * @type {MarkerNodeEmitter}
         */
        this.source = null;

        /**
         *
         * @type {GridDataNodePredicate}
         */
        this.nodePredicate = GridDataNodePredicateAny.INSTANCE;

        /**
         *
         * @type {MarkerNodeConsumerBuffer}
         */
        this.buffer = new MarkerNodeConsumerBuffer();
    }

    /**
     *
     * @param {MarkerNodeEmitter} source
     * @param {GridDataNodePredicate} predicate
     * @return {MarkerNodeEmitterPredicated}
     */
    static from({ source, predicate }) {
        assert.equal(source.isMarkerNodeEmitter, true, 'source.isMarkerNodeEmitter !== true');
        assert.equal(predicate.isGridDataNodePredicate, true, 'predicate.isGridDataNodePredicate !== true');

        const r = new MarkerNodeEmitterPredicated();

        r.source = source;
        r.nodePredicate = predicate;

        return r;
    }

    initialize(data, seed) {
        this.source.initialize(data, seed);
    }

    execute(data, x, y, rotation, consumer) {
        this.buffer.reset();

        this.source.execute(data, x, y, rotation, this.buffer);

        //check emitted nodes
        const n = this.buffer.size();

        const predicate = this.nodePredicate;

        for (let i = 0; i < n; i++) {
            const node = this.buffer.get(i);

            const valid = predicate.evaluate(data, node);

            if (!valid) {
                // node failed predicate check, reject all of the nodes
                return;
            }
        }

        // predicate passed, dump nodes into consumer
        this.buffer.emit(consumer);
    }
}
