import UUID from "../../../../core/UUID.js";
import { assert } from "../../../../core/assert.js";
import { inferReactiveExpressionTypes } from "../../../../core/model/reactive/transform/ReactiveTypeInferrence.js";
import DataType from "../../../../core/parser/simple/DataType.js";
import { compileReactiveExpression } from "../../../../core/land/reactive/compileReactiveExpression.js";
import { deserializeActionFromJSON } from "../actions/definition/deserializeActionFromJSON.js";
import { NumericInterval } from "../../../../core/math/interval/NumericInterval.js";

export class DynamicRuleDescription {
    constructor() {
        this.id = 0;

        /**
         *
         * @type {ReactiveExpression}
         */
        this.condition = null;

        /**
         *
         * @type {AbstractActionDescription}
         */
        this.action = null;

        /**
         *
         * @type {ReactiveReference[]}
         */
        this.references = [];

        /**
         * Rules with higher priority have the right to interrupt lower priority rules
         * @type {number}
         */
        this.priority = 0;

        /**
         * @private
         * @type {number}
         */
        this.predicate_complexity = 0;

        /**
         * How long should the rule remain inactive for after its activation
         * In seconds
         * @type {NumericInterval}
         */
        this.cooldown_global = new NumericInterval(0, 0);
    }

    /**
     *
     * @param {DynamicRuleDescription} other
     * @returns {boolean}
     */
    equals(other) {
        return this.id === other.id;
    }

    /**
     *
     * @returns {number}
     */
    getPredicateComplexity() {
        return this.predicate_complexity;
    }

    __increment_predicate_complexity() {
        this.predicate_complexity++;
    }

    build() {

        //infer types
        inferReactiveExpressionTypes(this.condition);

        if (this.condition.dataType === DataType.Any) {
            //enforce top level type
            this.condition.dataType = DataType.Boolean;
        }

        /**
         *
         * @type {ReactiveReference[]}
         */
        this.references.splice(0, this.references.length);

        this.condition.traverse((node) => {
            if (node.isReference) {
                this.references.push(node);
            }
        });

        this.condition.traverse(this.__increment_predicate_complexity, this);
    }

    fromJSON({
                 id = UUID.generate(),
                 condition,
                 action,
                 global_cooldown = NumericInterval.zero_zero,
                 priority = 0
             }) {
        assert.typeOf(condition, 'string', 'condition');

        assert.defined(action, 'action');
        assert.notNull(action, 'action');

        assert.isNumber(priority, 'priority');

        this.condition = compileReactiveExpression(condition);

        this.action = deserializeActionFromJSON(action);

        this.id = id;

        this.priority = priority;

        this.cooldown_global.fromJSON(global_cooldown);

        this.build();
    }
}
