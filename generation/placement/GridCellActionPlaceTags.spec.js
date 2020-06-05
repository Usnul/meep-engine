import { GridData } from "../grid/GridData.js";
import { GridCellActionPlaceTags } from "./GridCellActionPlaceTags.js";

test('write a single 1x1 set of tags', () => {
    const rule = new GridCellActionPlaceTags();
    rule.fill(0b101);

    const data = new GridData();

    data.resize(1, 1);

    rule.execute(data, 0, 0, 0);

    expect(data.readTags(0, 0)).toBe(0b101);
});
