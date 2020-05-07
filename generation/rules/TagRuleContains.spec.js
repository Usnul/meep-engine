import { TagRuleContains } from "./TagRuleContains.js";

test('correct match of a single tag', () => {
    const tag = TagRuleContains.from(1);

    expect(tag.match(1)).toBe(true);
    expect(tag.match(0)).toBe(false);
});
