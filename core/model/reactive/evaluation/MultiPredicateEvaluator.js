import { BitSet } from "../../../binary/BitSet.js";
import { HashMap } from "../../../collection/HashMap.js";
import { returnZero } from "../../../function/Functions.js";
import DataType from "../../../parser/simple/DataType.js";
import { assert } from "../../../assert.js";

class ExpressionNode {
    constructor() {
        /**
         *
         * @type {number}
         */
        this.index = 0;

        /**
         *
         * @type {ReactiveExpression}
         */
        this.expression = null;

        /**
         *
         * @type {ExpressionNode[]}
         */
        this.parents = [];

        /**
         * Arguments of the node, for terminal nodes this is empty
         * @type {ExpressionNode[]}
         */
        this.children = [];

        /**
         *
         * @type {number}
         * @private
         */
        this.__max_parent_score = 0;

        /**
         *
         * @type {number|string|boolean}
         * @private
         */
        this.__value = null;
    }

    setValue(v) {
        assert.defined(v, 'value');
        assert.notNull(v, 'value');

        this.__value = v;
    }

    getValue() {
        return this.__value;
    }

    /**
     *
     * @param {function(ReactiveExpression):number} scoringFunction
     * @return {number}
     */
    computeMaxParentScore(scoringFunction) {

        const n = this.parents.length;

        let result = 0;

        if (n === 0) {
            return scoringFunction(this.expression);
        } else {

            for (let i = 0; i < n; i++) {
                const parent = this.parents[i];

                result = max2(parent.computeMaxParentScore(scoringFunction));
            }
        }

        this.__max_parent_score = result;

        return result;
    }

    /**
     *
     * @return {number}
     */
    getScore() {
        return this.__max_parent_score;
    }
}

/**
 *
 * @param {ExpressionNode} n
 * @return {number}
 */
function scoreNode(n) {
    return n.getScore();
}

const temp_array = [];

/**
 * Evaluate given state against multiple predicates, order of evaluation is controlled by scoring function, highest score nodes are evaluated first
 */
export class MultiPredicateEvaluator {
    /**
     *
     * @param {function(ReactiveExpression):number} scoringFunction
     */
    constructor(scoringFunction = returnZero) {
        /**
         *
         * @type {function(ReactiveExpression): number}
         */
        this.scoringFunction = scoringFunction;

        /**
         *
         * @type {ReactiveExpression[]}
         */
        this.predicates = [];

        /**
         * Mask of evaluated nodes, if bit is set - node has been evaluated
         * @type {BitSet}
         */
        this.evaluated = new BitSet();

        /**
         * Mask where all literals have been pre-evaluated, used to skip evaluation of literal nodes during search
         * @type {BitSet}
         * @private
         */
        this.__pre_evaluated_literals = new BitSet();

        /**
         * Marks nodes that have failed to be evaluated, typically due to unresolved references
         * @type {BitSet}
         */
        this.invalidated = new BitSet();


        /**
         *
         * @type {HashMap<ReactiveExpression, ExpressionNode>}
         * @private
         */
        this.__predicate_node_index = new HashMap();

        /**
         *
         * @type {ReactiveExpression[]}
         * @private
         */
        this.__sorted_predicate_array = [];

        /**
         * Matching expression nodes to predicates
         * @type {ExpressionNode[]}
         * @private
         */
        this.__sorted_predicate_node_array = []

        /**
         *
         * @type {Object}
         * @private
         */
        this.__context = {};

        /**
         *
         * @type {number}
         * @private
         */
        this.__index_max = 0;

        /**
         *
         * @type {number}
         * @private
         */
        this.__iterator_cursor = 0;
    }

    /**
     *
     * @param {ReactiveExpression[]} predicates
     */
    build(predicates) {

        this.predicates.splice(0, this.predicates.length);

        const n = predicates.length;
        for (let i = 0; i < n; i++) {
            const predicate = predicates[i];

            const dataType = predicate.dataType;

            // validate data type
            assert.equal(dataType, DataType.Boolean, `predicate[${i}](=${predicate.toCode()}) data type must be boolean, instead was ${dataType}`);

            this.predicates.push(predicate);
        }

        // build sorted form
        this.__sorted_predicate_array = this.predicates.slice();
        this.__sorted_predicate_array.sort((a, b) => {
            return this.scoringFunction(b) - this.scoringFunction(a);
        });


        // rebuild index
        this.__predicate_node_index.clear();
        this.__sorted_predicate_array.forEach((p, index) => {
            const exp = this.__build_expression(p, undefined);

            this.__sorted_predicate_node_array[index] = exp;
        });

        this.predicates.forEach(p => {
            const node = this.__predicate_node_index.get(p);

            node.computeMaxParentScore(this.scoringFunction);
        });
    }

    /**
     *
     * @param {ReactiveExpression} exp
     * @param {ExpressionNode} parent
     * @returns {ExpressionNode}
     * @private
     */
    __build_expression(exp, parent) {
        /**
         *
         * @type {ExpressionNode}
         */
        let node = this.__predicate_node_index.get(exp);

        if (node === undefined) {
            node = new ExpressionNode();

            node.expression = exp;
            node.index = this.__index_max++;

            this.__predicate_node_index.set(exp, node);

            if (exp.isBinaryExpression) {
                node.children.push(
                    this.__build_expression(exp.left, node),
                    this.__build_expression(exp.right, node)
                );
            } else if (exp.isUnaryExpression) {
                node.children.push(
                    this.__build_expression(exp.source, node)
                );
            } else if (exp.isLiteral) {

                // record literal value and update mask
                node.setValue(exp.getValue());

                this.__pre_evaluated_literals.set(node.index, true);
            }
        }

        if (parent !== undefined) {
            node.parents.push(parent);
        }


        return node;
    }

    /**
     *
     * @param {ExpressionNode} node
     * @param {number|boolean|string} value
     * @private
     */
    __assign_value(node, value) {
        this.evaluated.set(node.index, true);

        node.setValue(value);

        const dataType = node.expression.dataType;

        // propagate value up to parents
        if (dataType === DataType.Boolean) {

            /**
             *
             * @type {ExpressionNode[]}
             */
            const parents = node.parents;

            const n = parents.length;

            for (let i = 0; i < n; i++) {
                const parent = parents[i];

                if (value === false) {
                    if (parent.isReactiveAnd === true) {
                        this.__assign_value(parent, false);
                    }
                } else {
                    if (parent.isReactiveOr === true) {
                        this.__assign_value(parent, true);
                    }
                }
            }

        }
    }

    /**
     *
     * @param {ExpressionNode} node
     * @private
     */
    __invalidate_node(node) {

        this.invalidated.set(node.index, true);

        const parents = node.parents;
        const n = parents.length;

        // propagate failure to ancestors
        for (let i = 0; i < n; i++) {
            const parent = parents[i];

            this.__invalidate_node(parent);
        }

    }

    /**
     *
     * @param {ExpressionNode} node
     * @returns {boolean} false if node failed to be resolved
     * @private
     */
    __resolve_node(node) {
        const node_index = node.index;

        if (this.invalidated.get(node_index)) {

            // already failed

            return false;
        }

        if (this.evaluated.get(node_index)) {

            // already evaluated

            return true;

        }

        const expression = node.expression;

        let value;
        if (expression.isReference) {

            value = expression.evaluate(this.__context);

            const value_type = typeof value;

            if (
                !(
                    (value_type === "number" && expression.dataType === DataType.Number)
                    || (value_type === "string" && expression.dataType === DataType.String)
                    || (value_type === "boolean" && expression.dataType === DataType.Boolean)
                )
            ) {

                // types do not match

                this.__invalidate_node(node);

                return false;
            }
        } else if (expression.isBinaryExpression) {

            const children = node.children;

            const left_node = children[0];
            const right_node = children[1];

            const resolved_children = this.__resolve_node(left_node) && this.__resolve_node(right_node);

            if (!resolved_children) {
                return false;
            }

            value = expression.transform(
                left_node.getValue(),
                right_node.getValue()
            );

        } else if (expression.isUnaryExpression) {

            const children = node.children;

            const source_node = children[0];

            const resolved_source = this.__resolve_node(source_node);

            if (!resolved_source) {
                return false;
            }

            value = expression.transform(
                source_node.getValue()
            );
        } else {
            throw new Error(`Unsupported node type. node=${expression.toCode()}`);
        }

        this.__assign_value(node, value);

        // successfully resolved
        return true;
    }


    initialize(context) {
        assert.typeOf(context, 'object', 'context');

        this.__iterator_cursor = 0;
        this.__context = context;

        this.evaluated.copy(this.__pre_evaluated_literals);
    }

    finalize() {
        this.invalidated.reset();
    }

    /**
     * @returns {ReactiveExpression|undefined}
     */
    next() {

        const n = this.__sorted_predicate_array.length;

        while (this.__iterator_cursor < n) {
            const iteratorCursor = this.__iterator_cursor;

            const node = this.__sorted_predicate_node_array[iteratorCursor];

            this.__iterator_cursor++;

            const isValidValue = this.__resolve_node(node);

            if (!isValidValue) {
                continue;
            }

            const value = node.getValue();

            if (value) {
                return this.__sorted_predicate_array[iteratorCursor];
            }
        }

        // nothing found
        return undefined;
    }
}
