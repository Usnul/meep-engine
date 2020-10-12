import { StaticKnowledgeDataTable } from "../../../../../model/game/database/StaticKnowledgeDataTable.js";
import { DynamicRuleDescription } from "./DynamicRuleDescription.js";
import { MultiPredicateEvaluator } from "../../../../core/model/reactive/evaluation/MultiPredicateEvaluator.js";
import { HashMap } from "../../../../core/collection/HashMap.js";


export class DynamicRuleDescriptionTable extends StaticKnowledgeDataTable {

    constructor() {
        super();


        /**
         * Used to speed up finding most complex matching predicate
         * @type {DynamicRuleDescription[]}
         * @private
         */
        this.__sorted_by_predicate_complexity = [];

        /**
         *
         * @type {HashMap<ReactiveExpression, DynamicRuleDescription[]>}
         * @private
         */
        this.__predicate_rule_mapping = new HashMap();
    }

    /**
     *
     * @param {ReactiveExpression} predicate
     * @return {DynamicRuleDescription[]|undefined}
     */
    getRulesByPredicate(predicate) {
        return this.__predicate_rule_mapping.get(predicate);
    }

    /**
     *
     * @return {MultiPredicateEvaluator}
     */
    buildEvaluator() {
        const evaluator = new MultiPredicateEvaluator(exp => exp.computeTreeSize());

        /**
         *
         * @type {DynamicRuleDescription[]}
         */
        const rules = this.asArray();

        evaluator.build(rules.map(r => r.condition));

        return evaluator;
    }

    buildIndex() {

        /**
         *
         * @type {DynamicRuleDescription[]}
         */
        const rules = this.asArray();


        // build sorted version
        this.__sorted_by_predicate_complexity = rules.slice();
        this.__sorted_by_predicate_complexity.sort((a, b) => {
            return b.getPredicateComplexity() - a.getPredicateComplexity();
        });

        // build predicate rule mapping
        const n = rules.length;

        for (let i = 0; i < n; i++) {
            const rule = rules[i];

            const bucket = this.__predicate_rule_mapping.get(rule.condition);

            if (bucket === undefined) {
                this.__predicate_rule_mapping.set(rule.condition, [rule]);
            } else {
                bucket.push(rule);
            }

        }
    }

    /**
     *
     * @param {Object} context
     * @returns {DynamicRuleDescription|undefined}
     */
    matchBest(context) {

        /**
         *
         * @type {DynamicRuleDescription[]}
         */
        const data = this.__sorted_by_predicate_complexity;

        const n = data.length;

        main:for (let i = 0; i < n; i++) {
            const rule = data[i];

            const references = rule.references;

            const n = references.length;

            for (let i = 0; i < n; i++) {
                const reactiveReference = references[i];

                if (context[reactiveReference.name] === undefined) {
                    continue main;
                }
            }

            const isMatch = rule.condition.evaluate(context);

            if (isMatch) {
                return rule;
            }
        }

        return undefined;
    }

    /**
     *
     * @param {Object} context
     * @returns {DynamicRuleDescription[]}
     */
    match(context) {

        const result = [];

        const data = this.__array;
        const n = data.length;

        main:for (let i = 0; i < n; i++) {
            const rule = data[i];

            const references = rule.references;

            const n = references.length;

            for (let i = 0; i < n; i++) {
                const reactiveReference = references[i];

                if (context[reactiveReference.name] === undefined) {
                    continue main;
                }
            }

            const isMatch = rule.condition.evaluate(context);

            if (isMatch) {
                result.push(rule);
            }
        }

        return result;
    }

    link(database, assetManager, executor) {
        this.buildIndex();

        return super.link(database, assetManager, executor);
    }

    parse(json) {
        const r = new DynamicRuleDescription();

        r.fromJSON(json);

        return r;
    }

}
