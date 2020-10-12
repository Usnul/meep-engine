import BinaryHeap from "../../../../engine/navigation/grid/FastBinaryHeap.js";
import { BitSet } from "../../../binary/BitSet.js";
import { HashMap } from "../../../collection/HashMap.js";
import { returnZero } from "../../../function/Functions.js";

class ExpressionNode {
    constructor() {

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
         *
         * @type {BinaryHeap<ExpressionNode>}
         */
        this.open = new BinaryHeap(scoreNode);

        /**
         * Mask of evaluated nodes, if bit is set - node has been evaluated
         * @type {BitSet}
         */
        this.evaluated = new BitSet();


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
    }

    /**
     *
     * @param {ReactiveExpression[]} predicates
     */
    build(predicates) {

        this.predicates = predicates;

        // build sorted form
        this.__sorted_predicate_array = this.predicates.slice();
        this.__sorted_predicate_array.sort((a, b) => {
            return this.scoringFunction(b) - this.scoringFunction(a);
        });


        // rebuild index
        this.__predicate_node_index.clear();
        this.predicates.forEach(p => {
            this.__build_expression(p, undefined);
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
            }
        }

        if (parent !== undefined) {
            node.parents.push(parent);
        }


        return node;
    }

    initialize() {

    }

    finalize() {

        this.open.clear();
        this.evaluated.reset();

    }

    next() {

    }
}
