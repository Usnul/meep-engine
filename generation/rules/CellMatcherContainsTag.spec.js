import { CellMatcherLayerBitMaskTest } from "./CellMatcherLayerBitMaskTest.js";
import { GridData } from "../grid/GridData.js";
import { GridDataLayer } from "../grid/layers/GridDataLayer.js";
import { DataType } from "../../core/collection/table/DataType.js";

test('correct match of a single tag', () => {
    const data = new GridData();

    const layer = GridDataLayer.from('a', DataType.Uint32);
    data.addLayer(layer)
    data.resize(1, 1);

    const tag = CellMatcherLayerBitMaskTest.from(1, 'a');

    tag.initialize(data, 0);

    expect(tag.match(data, 0, 0)).toBe(false);

    layer.sampler.writeChannel(0, 0, 0, 1);

    expect(tag.match(data, 0, 0)).toBe(true);
});
