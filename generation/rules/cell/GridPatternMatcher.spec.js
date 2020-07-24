import { CellMatcherGridPattern } from "./CellMatcherGridPattern.js";
import { GridData } from "../../grid/GridData.js";
import { CellMatcherLayerBitMaskTest } from "../CellMatcherLayerBitMaskTest.js";
import { GridDataLayer } from "../../grid/layers/GridDataLayer.js";
import { DataType } from "../../../core/collection/table/DataType.js";
import { GridPatternMatcherCell } from "./GridPatternMatcherCell.js";
import { CellMatcherNot } from "../logic/CellMatcherNot.js";

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

test('match 2-cell horizontal positive line with every rotation', () => {
    const matcher = CellMatcherLayerBitMaskTest.from(1, 'a');
    const matcher_not = CellMatcherNot.from(matcher);

    const pattern = CellMatcherGridPattern.from([
        GridPatternMatcherCell.from(matcher, 0, 0),
        GridPatternMatcherCell.from(matcher_not, 1, 0)
    ]);

    const data = new GridData();
    const tagLayer = GridDataLayer.from('a', DataType.Uint32);

    data.addLayer(tagLayer);

    data.resize(3, 3);

    tagLayer.sampler.writeChannel(0, 0, 0, 0);
    tagLayer.sampler.writeChannel(1, 0, 0, 0);
    tagLayer.sampler.writeChannel(2, 0, 0, 0);

    tagLayer.sampler.writeChannel(0, 1, 0, 0);
    tagLayer.sampler.writeChannel(1, 1, 0, 1);
    tagLayer.sampler.writeChannel(2, 1, 0, 0);

    tagLayer.sampler.writeChannel(0, 2, 0, 0);
    tagLayer.sampler.writeChannel(1, 2, 0, 0);
    tagLayer.sampler.writeChannel(2, 2, 0, 0);

    pattern.initialize(data, 0);

    expect(pattern.match(data, 1, 1, 0)).toBe(true);
    expect(pattern.match(data, 1, 1, R_90)).toBe(true);
    expect(pattern.match(data, 1, 1, R_180)).toBe(true);
    expect(pattern.match(data, 1, 1, R_270)).toBe(true);
});

test('match 2-cell horizontal negative line with every rotation', () => {
    const matcher = CellMatcherLayerBitMaskTest.from(1, 'a');
    const matcher_not = CellMatcherNot.from(matcher);

    const pattern = CellMatcherGridPattern.from([
        GridPatternMatcherCell.from(matcher, 0, 0),
        GridPatternMatcherCell.from(matcher_not, -1, 0)
    ]);

    const data = new GridData();
    const tagLayer = GridDataLayer.from('a', DataType.Uint32);

    data.addLayer(tagLayer);

    data.resize(3, 3);

    tagLayer.sampler.writeChannel(0, 0, 0, 0);
    tagLayer.sampler.writeChannel(1, 0, 0, 0);
    tagLayer.sampler.writeChannel(2, 0, 0, 0);

    tagLayer.sampler.writeChannel(0, 1, 0, 0);
    tagLayer.sampler.writeChannel(1, 1, 0, 1);
    tagLayer.sampler.writeChannel(2, 1, 0, 0);

    tagLayer.sampler.writeChannel(0, 2, 0, 0);
    tagLayer.sampler.writeChannel(1, 2, 0, 0);
    tagLayer.sampler.writeChannel(2, 2, 0, 0);

    pattern.initialize(data, 0);

    expect(pattern.match(data, 1, 1, 0)).toBe(true);
    expect(pattern.match(data, 1, 1, R_90)).toBe(true);
    expect(pattern.match(data, 1, 1, R_180)).toBe(true);
    expect(pattern.match(data, 1, 1, R_270)).toBe(true);
});

test('match 2-cell vertical positive line with every rotation', () => {
    const matcher = CellMatcherLayerBitMaskTest.from(1, 'a');
    const matcher_not = CellMatcherNot.from(matcher);

    const pattern = CellMatcherGridPattern.from([
        GridPatternMatcherCell.from(matcher, 0, 0),
        GridPatternMatcherCell.from(matcher_not, 0, 1)
    ]);

    const data = new GridData();
    const tagLayer = GridDataLayer.from('a', DataType.Uint32);

    data.addLayer(tagLayer);

    data.resize(3, 3);

    tagLayer.sampler.writeChannel(0, 0, 0, 0);
    tagLayer.sampler.writeChannel(1, 0, 0, 0);
    tagLayer.sampler.writeChannel(2, 0, 0, 0);

    tagLayer.sampler.writeChannel(0, 1, 0, 0);
    tagLayer.sampler.writeChannel(1, 1, 0, 1);
    tagLayer.sampler.writeChannel(2, 1, 0, 0);

    tagLayer.sampler.writeChannel(0, 2, 0, 0);
    tagLayer.sampler.writeChannel(1, 2, 0, 0);
    tagLayer.sampler.writeChannel(2, 2, 0, 0);

    pattern.initialize(data, 0);

    expect(pattern.match(data, 1, 1, 0)).toBe(true);
    expect(pattern.match(data, 1, 1, R_90)).toBe(true);
    expect(pattern.match(data, 1, 1, R_180)).toBe(true);
    expect(pattern.match(data, 1, 1, R_270)).toBe(true);
});

test('match 2-cell vertical negative line with every rotation', () => {
    const matcher = CellMatcherLayerBitMaskTest.from(1, 'a');
    const matcher_not = CellMatcherNot.from(matcher);

    const pattern = CellMatcherGridPattern.from([
        GridPatternMatcherCell.from(matcher, 0, 0),
        GridPatternMatcherCell.from(matcher_not, 0, -1)
    ]);

    const data = new GridData();
    const tagLayer = GridDataLayer.from('a', DataType.Uint32);

    data.addLayer(tagLayer);

    data.resize(3, 3);

    tagLayer.sampler.writeChannel(0, 0, 0, 0);
    tagLayer.sampler.writeChannel(1, 0, 0, 0);
    tagLayer.sampler.writeChannel(2, 0, 0, 0);

    tagLayer.sampler.writeChannel(0, 1, 0, 0);
    tagLayer.sampler.writeChannel(1, 1, 0, 1);
    tagLayer.sampler.writeChannel(2, 1, 0, 0);

    tagLayer.sampler.writeChannel(0, 2, 0, 0);
    tagLayer.sampler.writeChannel(1, 2, 0, 0);
    tagLayer.sampler.writeChannel(2, 2, 0, 0);

    pattern.initialize(data, 0);

    expect(pattern.match(data, 1, 1, 0)).toBe(true);
    expect(pattern.match(data, 1, 1, R_90)).toBe(true);
    expect(pattern.match(data, 1, 1, R_180)).toBe(true);
    expect(pattern.match(data, 1, 1, R_270)).toBe(true);
});

test('match 2x2-cell with every rotation', () => {
    const matcher = CellMatcherLayerBitMaskTest.from(1, 'a');
    const matcher_not = CellMatcherNot.from(matcher);

    const pattern = CellMatcherGridPattern.from([
        GridPatternMatcherCell.from(matcher, 0, 0),
        GridPatternMatcherCell.from(matcher_not, 0, 1),
        GridPatternMatcherCell.from(matcher_not, -1, 0),
        GridPatternMatcherCell.from(matcher_not, -1, 1),
    ]);

    const data = new GridData();
    const tagLayer = GridDataLayer.from('a', DataType.Uint32);

    data.addLayer(tagLayer);

    data.resize(3, 3);

    tagLayer.sampler.writeChannel(0, 0, 0, 0);
    tagLayer.sampler.writeChannel(1, 0, 0, 0);
    tagLayer.sampler.writeChannel(2, 0, 0, 0);

    tagLayer.sampler.writeChannel(0, 1, 0, 0);
    tagLayer.sampler.writeChannel(1, 1, 0, 1);
    tagLayer.sampler.writeChannel(2, 1, 0, 0);

    tagLayer.sampler.writeChannel(0, 2, 0, 0);
    tagLayer.sampler.writeChannel(1, 2, 0, 0);
    tagLayer.sampler.writeChannel(2, 2, 0, 0);

    pattern.initialize(data, 0);

    expect(pattern.match(data, 1, 1, 0)).toBe(true);
    expect(pattern.match(data, 1, 1, R_90)).toBe(true);
    expect(pattern.match(data, 1, 1, R_180)).toBe(true);
    expect(pattern.match(data, 1, 1, R_270)).toBe(true);
});

test('match 2x2-cell with every rotation on 4x4 field', () => {
    const matcher = CellMatcherLayerBitMaskTest.from(1, 'a');
    const matcher_not = CellMatcherNot.from(matcher);

    const pattern = CellMatcherGridPattern.from([
        GridPatternMatcherCell.from(matcher, 0, 0),
        GridPatternMatcherCell.from(matcher_not, 0, 1),
        GridPatternMatcherCell.from(matcher_not, 1, 0),
        GridPatternMatcherCell.from(matcher_not, 1, 1),
    ]);

    const data = new GridData();
    const tagLayer = GridDataLayer.from('a', DataType.Uint32);

    data.addLayer(tagLayer);

    data.resize(4, 4);

    tagLayer.sampler.writeChannel(0, 0, 0, 0);
    tagLayer.sampler.writeChannel(1, 0, 0, 0);
    tagLayer.sampler.writeChannel(2, 0, 0, 0);
    tagLayer.sampler.writeChannel(3, 0, 0, 0);

    tagLayer.sampler.writeChannel(0, 1, 0, 0);
    tagLayer.sampler.writeChannel(1, 1, 0, 1);
    tagLayer.sampler.writeChannel(2, 1, 0, 1);
    tagLayer.sampler.writeChannel(3, 1, 0, 0);

    tagLayer.sampler.writeChannel(0, 2, 0, 0);
    tagLayer.sampler.writeChannel(1, 2, 0, 1);
    tagLayer.sampler.writeChannel(2, 2, 0, 1);
    tagLayer.sampler.writeChannel(3, 2, 0, 0);

    tagLayer.sampler.writeChannel(0, 3, 0, 0);
    tagLayer.sampler.writeChannel(1, 3, 0, 0);
    tagLayer.sampler.writeChannel(2, 3, 0, 0);
    tagLayer.sampler.writeChannel(3, 3, 0, 0);

    pattern.initialize(data, 0);

    expect(pattern.match(data, 2, 2, 0)).toBe(true);
    expect(pattern.match(data, 1, 2, R_90)).toBe(true);
    expect(pattern.match(data, 1, 1, R_180)).toBe(true);
    expect(pattern.match(data, 2, 1, R_270)).toBe(true);
});
