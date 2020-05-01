import { TagRuleBinary } from "./TagRuleBinary.js";

export class TagRuleOr extends TagRuleBinary {
    match(tags) {
        return this.left.match(tags) || this.right.match(tags);
    }
}
