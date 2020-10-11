import { AbstractActionDescription } from "./AbstractActionDescription.js";
import { WeightedRandomBehavior } from "../../../../intelligence/behavior/selector/WeightedRandomBehavior.js";
import { WeightedElement } from "../../../../intelligence/behavior/selector/WeightedElement.js";

export class WeightedRandomActionDescription extends AbstractActionDescription {
    constructor() {
        super();

        /**
         *
         * @type {WeightedElement<AbstractActionDescription>[]}
         */
        this.elements = [];
    }

    execute(actor, dataset, context, system) {

        /**
         *
         * @type {WeightedElement<Behavior>[]}
         */
        const elements = this.elements.map(e => {
            const b = e.data.execute(actor, dataset, context, system);

            return WeightedElement.from(b, e.weight);
        });

        const b = WeightedRandomBehavior.from(elements);

        // remix actor entity index to produce large difference for small entity ID differences
        const seed = (actor >> 16) | (actor << 16);

        b.setRandomSeed(seed);

        return b;
    }

    /**
     *
     * @param {AbstractActionDescription} action
     * @param {number} weight
     */
    addElement(action, weight) {

        const e = WeightedElement.from(action, weight);

        this.elements.push(e);

    }
}
