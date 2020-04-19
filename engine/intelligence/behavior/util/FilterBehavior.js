import { SequenceBehavior } from "../composite/SequenceBehavior.js";

export class FilterBehavior extends SequenceBehavior {
    constructor() {
        super();

    }

    /**
     *
     * @param {Behavior[]} conditions
     * @param {Behavior[]} actions
     * @returns {FilterBehavior}
     */
    static from(conditions, actions) {
        const r = new FilterBehavior();

        conditions.forEach(b => r.addCondition(b));
        actions.forEach(b => r.addAction(b));

        return r;
    }

    addChild(child) {
        throw new Error('Direct injection of children is not allowed, use addCodition and addAction isntead');
    }

    /**
     *
     * @param {Behavior} condition
     */
    addCondition(condition) {
        this.__children.unshift(condition);
    }

    /**
     *
     * @param {Behavior} action
     */
    addAction(action) {
        this.__children.push(action);
    }
}
