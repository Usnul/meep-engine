import { TagRule } from "./TagRule.js";

export class TagRuleContains extends TagRule {
    constructor() {
        super();

        /**
         * Mask
         * @type {number}
         */
        this.tags = 0;
    }

    match(tags) {
        return (tags & this.tags) === this.tags;
    }

    /**
     *
     * @param {number} mask
     * @return {TagRuleContains}
     */
    static from(mask) {
        const r = new TagRuleContains();

        r.tags = mask;

        return r;
    }
}
