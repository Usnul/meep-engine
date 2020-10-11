import { Behavior } from "../Behavior.js";
import { seededRandom } from "../../../../core/math/MathUtils.js";
import { weightedRandomFromArray } from "../../../../core/collection/array/weightedRandomFromArray.js";
import { WeightedElement } from "./WeightedElement.js";
import { assert } from "../../../../core/assert.js";

export class WeightedRandomBehavior extends Behavior {
    constructor() {
        super();

        /**
         *
         * @type {WeightedElement<Behavior>[]} elements
         * @private
         */
        this.__elements = [];

        /**
         *
         * @type {function(): number}
         * @private
         */
        this.__random = seededRandom(91512);

        /**
         *
         * @type {Behavior|undefined}
         * @private
         */
        this.__selected = undefined;
    }

    /**
     *
     * @param {number} v
     */
    setRandomSeed(v) {
        this.__random.setCurrentSeed(v);
    }

    /**
     *
     * @param {WeightedElement<Behavior>[]} elements
     */
    setElements(elements) {
        this.__elements = [];

        elements.forEach(this.addElement, this);
    }

    /**
     *
     * @param {WeightedElement<Behavior>} e
     */
    addElement(e) {

        assert.defined(e, 'element');
        assert.notNull(e, 'element');

        assert.typeOf(e, 'object', 'element');

        assert.equal(e.isWeightedElement, true, 'element.isWeightedElement !== true');
        assert.equal(e.data.isBehavior, true, 'element.data.isWeightedElement !== true');

        this.__elements.push(e);
    }

    /**
     *
     * @param {WeightedElement<Behavior>[]} elements
     * @returns {WeightedRandomBehavior}
     */
    static from(elements) {
        const r = new WeightedRandomBehavior();

        r.setElements(elements);

        return r;
    }

    __select() {
        /**
         *
         * @type {WeightedElement<Behavior>|undefined}
         */
        const weightedElement = weightedRandomFromArray(this.__elements, this.__random, WeightedElement.getWeight);

        this.__selected = weightedElement.data;
    }

    initialize(context) {
        super.initialize(context);

        this.__select();

        this.__selected.initialize(context);
    }

    finalize() {
        super.finalize();

        this.__selected.finalize();

        this.__selected = undefined;
    }

    tick(timeDelta) {
        const s = this.__selected.tick(timeDelta);

        this.setStatus(s);

        return s;
    }
}
