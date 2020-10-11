import { invokeObjectEquals } from "../../../../core/function/Functions.js";
import { computeHashFloat, computeHashIntegerArray } from "../../../../core/math/MathUtils.js";
import { invokeObjectHash } from "../../../../core/model/ObjectUtils.js";
import { assert } from "../../../../core/assert.js";

export class WeightedElement {

    /**
     * @template T
     */
    constructor() {

        this.weight = 1;

        /**
         *
         * @type {T}
         */
        this.data = null;

    }

    /**
     * @template T
     * @param {T} element
     * @param {number} weight
     * @returns {WeightedElement<T>}
     */
    static from(element, weight) {
        assert.isNumber(weight, 'weight');

        const r = new WeightedElement();

        r.data = element;
        r.weight = weight;

        return r;
    }

    /**
     * @template X
     * @param {WeightedElement<X>} object
     * @return {number}
     */
    static getWeight(object) {
        return object.weight;
    }

    /**
     *
     * @param {T} other
     * @return {boolean}
     */
    equals(other) {
        return this.weight === other.weight
            && invokeObjectEquals(this.data, other.element);
    }

    /**
     *
     * @return {number}
     */
    hash() {
        return computeHashIntegerArray(
            computeHashFloat(this.weight),
            invokeObjectHash(this.data)
        );
    }
}

/**
 * @readonly
 * @type {boolean}
 */
WeightedElement.prototype.isWeightedElement = true;
