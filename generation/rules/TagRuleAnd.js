import { TagRuleBinary } from "./TagRuleBinary.js";

export class TagRuleAnd extends TagRuleBinary {

    match(tags) {
        return this.left.match(tags) && this.right.match(tags);
    }

    /**
     *
     * @param {TagRule} left
     * @param {TagRule} right
     * @returns {TagRuleAnd}
     */
    static from(left, right) {
        const r = new TagRuleAnd();

        r.left = left;
        r.right = right;

        return r;
    }
}
