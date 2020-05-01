import { TagRule } from "./TagRule.js";

export class TagRuleDecorator extends TagRule {
    constructor() {
        super();

        /**
         *
         * @type {TagRule}
         */
        this.source = null;
    }
}
