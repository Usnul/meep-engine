import { GridData } from "../grid/GridData.js";
import { GridCellActionPlaceTags } from "./GridCellActionPlaceTags.js";
import { GridDataLayer } from "../grid/layers/GridDataLayer.js";
import { DataType } from "../../core/collection/table/DataType.js";

test('write a single 1x1 set of tags', () => {
    const data = new GridData();

    const layer = GridDataLayer.from('a', DataType.Uint32);

    data.addLayer(layer);

    const rule = GridCellActionPlaceTags.from(0b101, 'a');

    data.resize(1, 1);

    rule.initialize(data);
    rule.execute(data, 0, 0, 0);

    expect(layer.sampler.readChannel(0, 0, 0)).toBe(0b101);
});
