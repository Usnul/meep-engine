import UUID from "../../../../core/UUID.js";
import { assert } from "../../../../core/assert.js";
import { inferReactiveExpressionTypes } from "../../../../core/model/reactive/transform/ReactiveTypeInferrence.js";
import DataType from "../../../../core/parser/simple/DataType.js";
import { compileReactiveExpression } from "../../../../core/land/reactive/compileReactiveExpression.js";
import { deserializeActionFromJSON } from "../actions/definition/deserializeActionFromJSON.js";

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
        this.pririty = 0;

        /**
         * @private
         * @type {number}
         */
        this.predicate_complexity = 0;
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

    fromJSON({ id = UUID.generate(), condition, action }) {
        assert.typeOf(condition, 'string', 'condition');

        assert.defined(action, 'action');
        assert.notNull(action, 'action');

        this.condition = compileReactiveExpression(condition);

        this.action = deserializeActionFromJSON(action);

        this.id = id;

        this.build();
    }
}
