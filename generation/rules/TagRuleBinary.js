import { TagRule } from "./TagRule.js";

export class TagRuleBinary extends TagRule {

    constructor() {
        super();

        /**
         *
         * @type {TagRule}
         */
        this.left = null;
        /**
         *
         * @type {TagRule}
         */
        this.right = null;
    }
}
