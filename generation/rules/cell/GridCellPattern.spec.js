import { GridCellMatcher } from "./GridCellMatcher.js";
import { GridData } from "../../GridData.js";
import { GridCellRuleContainsTag } from "../TagRuleContains.js";

const R_90 = Math.PI / 2;
const R_180 = Math.PI;
const R_270 = Math.PI * (3 / 2);


test('constructor does not throw', () => {
    new GridCellMatcher();
});

test('always matches empty rule set', () => {
    const pattern = new GridCellMatcher();

    const data = new GridData();

    data.resize(1, 1);

    expect(pattern.match(data, 0, 0, 0)).toBe(true);
    expect(pattern.match(data, 0, 0, R_90)).toBe(true);
    expect(pattern.match(data, 0, 0, R_180)).toBe(true);
    expect(pattern.match(data, 0, 0, R_270)).toBe(true);
});

test('exact single point match', () => {
    const pattern = new GridCellMatcher();

    pattern.addRule(0, 0, GridCellRuleContainsTag.from(1));

    const data = new GridData();

    data.resize(2, 1);
    data.setTags(0, 0, 1);

    expect(pattern.match(data, 0, 0, 0)).toBe(true);
    expect(pattern.match(data, 0, 0, R_90)).toBe(true);
    expect(pattern.match(data, 0, 0, R_180)).toBe(true);
    expect(pattern.match(data, 0, 0, R_270)).toBe(true);

    expect(pattern.match(data, 1, 0, 0)).toBe(false);
    expect(pattern.match(data, 1, 0, R_90)).toBe(false);
    expect(pattern.match(data, 1, 0, R_180)).toBe(false);
    expect(pattern.match(data, 1, 0, R_270)).toBe(false);

});
