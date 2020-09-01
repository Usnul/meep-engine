/**
 * Created by Alex on 29/01/14.
 */


import { assert } from "../assert.js";

/**
 *
 * @enum {number}
 */
export const EdgeDirectionType = {
    Undirected: 3,
    Forward: 1,
    Backward: 2
};

export class Edge {
    /**
     * @template N
     * @param {N} a
     * @param {N} b
     * @constructor
     */
    constructor(a, b) {
        assert.notEqual(a, undefined, 'a is undefined');
        assert.notEqual(b, undefined, 'b is undefined');

        /**
         *
         * @type {N}
         */
        this.first = a;
        /**
         *
         * @type {N}
         */
        this.second = b;

        /**
         * @type {EdgeDirectionType}
         */
        this.direction = EdgeDirectionType.Undirected;
    }

    contains(node) {
        return this.first === node || this.second === node;
    }

    validateTransition(source, target) {
        const a = this.first;
        const b = this.second;
        return (a === source && b === target && this.traversableForward()) || (b === source && a === target && this.traversableBackward());
    }

    /**
     * Provided one of the associated nodes - returns the other one, if supplied node is not connecting the edge - returns first node (unintended behaviour)
     * @param {N} node
     * @returns {N}
     */
    other(node) {
        return (node === this.first) ? this.second : this.first;
    }

    /**
     *
     * @returns {boolean}
     */
    traversableForward() {
        return (this.direction & EdgeDirectionType.Forward) !== 0;
    }

    /**
     *
     * @returns {boolean}
     */
    traversableBackward() {
        return (this.direction & EdgeDirectionType.Backward) !== 0;
    }

    /**
     * @deprecated
     * @returns {number}
     */
    angle() {
        const delta = this.second.clone().sub(this.first);
        return Math.atan2(delta.y, delta.x);
    }

    /**
     *
     * @returns {N[]}
     */
    get nodes() {
        return [this.first, this.second];
    }


    /**
     * @deprecated
     * @returns {number}
     */
    get length() {
        return this.first.distanceTo(this.second);
    }
}

