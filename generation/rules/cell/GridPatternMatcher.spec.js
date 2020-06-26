import { CellMatcherGridPattern } from "./CellMatcherGridPattern.js";
import { GridData } from "../../grid/GridData.js";
import { CellMatcherLayerBitMaskTest } from "../CellMatcherLayerBitMaskTest.js";
import { GridDataLayer } from "../../grid/layers/GridDataLayer.js";
import { DataType } from "../../../core/collection/table/DataType.js";

const R_90 = Math.PI / 2;
const R_180 = Math.PI;
const R_270 = Math.PI * (3 / 2);


test('constructor does not throw', () => {
    new CellMatcherGridPattern();
});

test('always matches empty rule set', () => {
    const pattern = new CellMatcherGridPattern();

    const data = new GridData();

    data.resize(1, 1);

    expect(pattern.match(data, 0, 0, 0)).toBe(true);
    expect(pattern.match(data, 0, 0, R_90)).toBe(true);
    expect(pattern.match(data, 0, 0, R_180)).toBe(true);
    expect(pattern.match(data, 0, 0, R_270)).toBe(true);
});

test('exact single point match', () => {
    const pattern = new CellMatcherGridPattern();

    pattern.addRule(0, 0, CellMatcherLayerBitMaskTest.from(1, 'a'));

    const data = new GridData();
    const tagLayer = GridDataLayer.from('a', DataType.Uint32);

    data.addLayer(tagLayer);

    data.resize(2, 1);

    tagLayer.sampler.writeChannel(0, 0, 0, 1);

    pattern.initialize(data, 0);

    expect(pattern.match(data, 0, 0, 0)).toBe(true);
    expect(pattern.match(data, 0, 0, R_90)).toBe(true);
    expect(pattern.match(data, 0, 0, R_180)).toBe(true);
    expect(pattern.match(data, 0, 0, R_270)).toBe(true);

    expect(pattern.match(data, 1, 0, 0)).toBe(false);
    expect(pattern.match(data, 1, 0, R_90)).toBe(false);
    expect(pattern.match(data, 1, 0, R_180)).toBe(false);
    expect(pattern.match(data, 1, 0, R_270)).toBe(false);

});
