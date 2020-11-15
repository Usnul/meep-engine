import { computeHashIntegerArray } from "../../../math/MathUtils.js";
import { assert } from "../../../assert.js";

/**
 * Reference for a port of a node instance
 */
export class NodeInstancePortReference {

    constructor() {
        /**
         *
         * @type {NodeInstance}
         */
        this.instance = null;
        /**
         *
         * @type {Port}
         */
        this.port = null;
    }


    /**
     *
     * @param {NodeInstance} instance
     * @param {Port} port
     * @returns {NodeInstancePortReference}
     */
    static from(instance, port) {
        assert.defined(instance, 'instance');
        assert.notNull(instance, 'instance');

        assert.defined(port, 'port');
        assert.notNull(port, 'port');

        const r = new NodeInstancePortReference();

        r.instance = instance;
        r.port = port;

        return r;
    }

    /**
     *
     * @param {NodeInstance} instance
     * @param {Port} port
     */
    set(instance, port) {
        assert.defined(instance, 'instance');
        assert.notNull(instance, 'instance');

        assert.defined(port, 'port');
        assert.notNull(port, 'port');

        this.instance = instance;
        this.port = port;
    }

    hash() {
        return computeHashIntegerArray(
            this.instance.hash(),
            this.port.hash()
        );
    }

    /**
     *
     * @param {NodeInstancePortReference} other
     * @returns {boolean}
     */
    equals(other) {
        return this.instance.equals(other.instance)
            && this.port.equals(other.port)
            ;
    }
}
