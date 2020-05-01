import { TagRuleDecorator } from "./TagRuleDecorator.js";

export class TagRuleNot extends TagRuleDecorator {
    match(tags) {
        return !this.source.match(tags);
    }
}
