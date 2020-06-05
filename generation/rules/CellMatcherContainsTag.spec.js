import { CellMatcherLayerBitMaskTest } from "./CellMatcherLayerBitMaskTest.js";
import { GridData } from "../grid/GridData.js";
import { GridDataLayer } from "../grid/layers/GridDataLayer.js";
import { DataType } from "../../core/collection/table/DataType.js";

test('correct match of a single tag', () => {
    const data = new GridData();

    data.addLayer(GridDataLayer.from('a', DataType.Uint32))
    data.resize(1, 1);

    const tag = CellMatcherLayerBitMaskTest.from(1, 'a');

    expect(tag.match(data, 0, 0)).toBe(false);

    data.setTags(0, 0, 1);

    expect(tag.match(data, 0, 0)).toBe(true);
});
