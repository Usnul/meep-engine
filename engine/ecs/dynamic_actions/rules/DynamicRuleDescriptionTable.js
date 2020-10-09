import { StaticKnowledgeDataTable } from "../../../../../model/game/database/StaticKnowledgeDataTable.js";
import { DynamicRuleDescription } from "./DynamicRuleDescription.js";


export class DynamicRuleDescriptionTable extends StaticKnowledgeDataTable {

    constructor() {
        super();


        /**
         * Used to speed up finding most complex matching predicate
         * @type {DynamicRuleDescription[]}
         * @private
         */
        this.__sorted_by_predicate_complexity = [];
    }

    buildIndex() {

        // build sorted version

        this.__sorted_by_predicate_complexity = this.__array.slice();
        this.__sorted_by_predicate_complexity.sort((a, b) => {
            return b.getPredicateComplexity() - a.getPredicateComplexity();
        });
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
