import { MarkerNodeConsumer } from "./MarkerNodeConsumer.js";

export class MarkerNodeConsumerBuffer extends MarkerNodeConsumer {
    constructor() {
        super();

        /**
         *
         * @type {MarkerNode[]}
         */
        this.data = [];

        /**
         *
         * @type {number}
         */
        this.pointer = 0;
    }

    reset() {
        this.pointer = 0;
    }

    /**
     *
     * @return {MarkerNode}
     */
    last() {
        return this.data[this.pointer - 1];
    }

    /**
     *
     * @return {boolean}
     */
    isEmpty() {
        return this.pointer <= 0;
    }

    /**
     *
     * @return {number}
     */
    size() {
        return this.pointer;
    }

    /**
     *
     * @param {number} index
     * @return {MarkerNode}
     */
    get(index) {
        return this.data[index];
    }

    consume(node) {
        this.data[this.pointer++] = node;
    }

    /**
     *
     * @param {MarkerNodeConsumer} target
     */
    emit(target) {
        const p = this.pointer;
        for (let i = 0; i < p; i++) {
            const node = this.data[i];

            target.consume(node);
        }
    }

    /**
     *
     * @param {GridData} grid
     */
    writeToGrid(grid) {

        const p = this.pointer;
        for (let i = 0; i < p; i++) {
            const node = this.data[i];

            grid.addMarker(node);
        }
    }
}
