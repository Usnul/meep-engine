import { AbstractActionDescription } from "./AbstractActionDescription.js";
import { ActionBehavior } from "../../../../intelligence/behavior/primitive/ActionBehavior.js";
import { Blackboard } from "../../../../intelligence/blackboard/Blackboard.js";
import { compileReactiveExpression } from "../../../../../core/land/reactive/compileReactiveExpression.js";
import { assert } from "../../../../../core/assert.js";

export class WhiteToBlackboardActionDescription extends AbstractActionDescription {
    constructor() {
        super();

        /**
         *
         * @type {ReactiveExpression}
         */
        this.expression = null;

        /**
         *
         * @type {string}
         */
        this.name = "";
    }

    execute(actor, dataset, context, system) {

        const expression = this.expression;
        const name = this.name;

        return new ActionBehavior(() => {

            const blackboard = dataset.getComponent(actor, Blackboard);

            const value = blackboard.acquire(name, expression.dataType);

            value.set(expression.evaluate(context));

        });

    }

    /**
     *
     * @param {string} name
     * @param {string} value
     */
    fromJSON({ name, value }) {

        assert.typeOf(name, 'string', 'name');

        this.name = name;

        this.expression = compileReactiveExpression(value);

    }
}


WhiteToBlackboardActionDescription.prototype.type = "Write";
