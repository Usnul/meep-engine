import { Color } from "../../../../core/color/Color.js";
import { assert } from "../../../../core/assert.js";
import { computeHashFloat, computeHashIntegerArray } from "../../../../core/math/MathUtils.js";
import { COMPONENT_SERIALIZATION_TRANSIENT_FIELD } from "../../../ecs/storage/COMPONENT_SERIALIZATION_TRANSIENT_FIELD.js";

export class HighlightDefinition {
    constructor() {

        /**
         *
         * @type {Color}
         */
        this.color = new Color();

        /**
         * Value from 0 to 1
         * @type {number}
         */
        this.opacity = 1;

        /**
         *
         * @type {boolean}
         */
        this[COMPONENT_SERIALIZATION_TRANSIENT_FIELD] = false;
    }

    /**
     *
     * @param {HighlightDefinition} other
     * @returns {boolean}
     */
    equals(other) {
        return this.opacity === other.opacity
            && this.color.equals(other.color);
    }

    /**
     *
     * @returns {number}
     */
    hash() {
        return computeHashIntegerArray(
            this.color.hash(),
            computeHashFloat(this.opacity)
        );
    }

    fromJSON({ opacity = 1, color }) {
        assert.isNumber(opacity, 'opacity');

        this.opacity = opacity;
        this.color.fromJSON(color);
    }

    toJSON() {
        return {
            opacity: this.opacity,
            color: this.color.toJSON()
        };
    }

    /**
     *
     * @param j
     * @return {HighlightDefinition}
     */
    static fromJSON(j) {
        const r = new HighlightDefinition();

        r.fromJSON(j);

        return r;
    }
}
