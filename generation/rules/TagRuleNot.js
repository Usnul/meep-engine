import { TagRuleDecorator } from "./TagRuleDecorator.js";

export class TagRuleNot extends TagRuleDecorator {
    match(tags) {
        return !this.source.match(tags);
    }

    /**
     *
     * @param {TagRule} source
     * @return {TagRuleNot}
     */
    static from(source) {
        const r = new TagRuleNot();

        r.source = source;

        return r;
    }
}
