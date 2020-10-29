import UUID from "../../../../core/UUID.js";
import { assert } from "../../../../core/assert.js";
import { inferReactiveExpressionTypes } from "../../../../core/model/reactive/transform/ReactiveTypeInferrence.js";
import DataType from "../../../../core/parser/simple/DataType.js";
import { compileReactiveExpression } from "../../../../core/land/reactive/compileReactiveExpression.js";
import { deserializeActionFromJSON } from "../actions/definition/deserializeActionFromJSON.js";
import { DynamicRuleCooldownDescription } from "./DynamicRuleCooldownDescription.js";

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
         * Specified which global cooldowns will be triggered and for how long
         * @type {DynamicRuleCooldownDescription[]}
         */
        this.cooldowns_global = [];
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

        const included = {};

        this.condition.traverse((node) => {

            if (node.isReference && included[node.name] === undefined) {

                this.references.push(node);

                included[node.name] = true;

            }

        });

        this.condition.traverse(this.__increment_predicate_complexity, this);
    }

    fromJSON({
                 id = UUID.generate(),
                 condition,
                 action,
                 global_cooldowns = [],
                 priority = 0
             }) {
        assert.typeOf(condition, 'string', 'condition');

        assert.defined(action, 'action');
        assert.notNull(action, 'action');

        assert.isNumber(priority, 'priority');

        assert.isArray(global_cooldowns, 'global_cooldowns');

        this.condition = compileReactiveExpression(condition);

        this.action = deserializeActionFromJSON(action);

        this.id = id;

        this.priority = priority;

        this.cooldowns_global = global_cooldowns.map(DynamicRuleCooldownDescription.fromJSON);

        this.build();
    }
}
