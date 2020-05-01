import { assert } from "../core/assert.js";

export class GridData {
    constructor() {
        this.width = 0;
        this.height = 0;

        /**
         *
         * @type {Uint32Array}
         */
        this.tags = new Uint32Array();
    }

    /**
     *
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        assert.typeOf(width, 'number', 'width');
        assert.typeOf(height, 'number', 'height');

        if (width === this.width && height === this.height) {
            //no need, already the right size
            return;
        }

        this.width = width;
        this.height = height;

        this.tags = new Uint32Array(width * height);
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} mask
     */
    clearTags(x, y, mask) {

        const cellIndex = y * this.width + x;

        const current = this.tags[cellIndex];

        const newValue = current & (~mask);

        this.tags[cellIndex] = newValue;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} mask
     */
    setTags(x, y, mask) {

        const cellIndex = y * this.width + x;

        const current = this.tags[cellIndex];

        const newValue = current | mask;

        this.tags[cellIndex] = newValue;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @return {number}
     */
    readTags(x, y) {
        const cellIndex = y * this.width + x;
        return this.tags[cellIndex];
    }
}
