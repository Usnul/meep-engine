import { GridCellRuleContainsTag } from "./GridCellRuleContainsTag.js";
import { GridData } from "../GridData.js";

test('correct match of a single tag', () => {
    const data = new GridData();
    data.resize(1, 1);

    const tag = GridCellRuleContainsTag.from(1);

    expect(tag.match(data, 0, 0)).toBe(false);

    data.setTags(0, 0, 1);

    expect(tag.match(data, 0, 0)).toBe(true);
});
