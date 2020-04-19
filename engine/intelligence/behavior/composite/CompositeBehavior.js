import { Behavior } from "../Behavior.js";
import { assert } from "../../../../core/assert.js";

export class CompositeBehavior extends Behavior {
    constructor() {
        super();

        /**
         *
         * @type {Behavior[]}
         * @protected
         */
        this.__children = [];
    }

    /**
     *
     * @param {Behavior} child
     */
    addChild(child) {
        assert.defined(child);
        assert.ok(child.isBehavior, 'child is not a Behavior');

        this.__children.push(child);
    }

    /**
     * NOTE: do not modify obtained value
     * @return {Behavior[]}
     */
    getChildren() {
        return this.__children;
    }

    /**
     *
     * @param {Behavior} child
     * @returns {boolean}
     */
    removeChild(child) {
        const i = this.__children.indexOf(child);

        if (i === -1) {
            //child is not found
            return false;
        } else {
            this.__children.splice(i, 1);

            return true;
        }
    }

    clearChildren() {
        this.__children = [];
    }
}
