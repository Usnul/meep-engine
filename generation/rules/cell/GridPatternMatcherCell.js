import Vector2 from "../../../core/geom/Vector2.js";

export class GridPatternMatcherCell {
    constructor() {
        /**
         *
         * @type {CellMatcher}
         */
        this.rule = null;

        /**
         *
         * @type {Vector2}
         */
        this.position = new Vector2();
    }

    /**
     *
     * @param {CellMatcher} rule
     * @param {number} x
     * @param {number} y
     * @returns {GridPatternMatcherCell}
     */
    static from(rule, x, y) {
        const r = new GridPatternMatcherCell();

        r.rule = rule;
        r.position.set(x, y);

        return r;
    }
}
