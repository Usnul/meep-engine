import { GridData } from "../../../grid/GridData.js";
import { computeCellFilterGradient } from "./computeCellFilterGradient.js";
import { CellFilterCellMatcher } from "../../CellFilterCellMatcher.js";
import { CellMatcherLayerBitMaskTest } from "../../../rules/CellMatcherLayerBitMaskTest.js";
import { GridDataLayer } from "../../../grid/layers/GridDataLayer.js";
import { DataType } from "../../../../core/collection/table/DataType.js";

test('computeCellFilterGradient center', () => {

    const grid = new GridData();
    const layer = GridDataLayer.from('a', DataType.Uint32);

    grid.addLayer(layer);
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(CellMatcherLayerBitMaskTest.from(1, 'a'));

    filter.initialize(grid,0);

    layer.sampler.writeChannel(0, 0,0, 0);
    layer.sampler.writeChannel(1, 0, 0, 0);
    layer.sampler.writeChannel(2, 0, 0, 0);

    layer.sampler.writeChannel(0, 1, 0, 0);
    layer.sampler.writeChannel(1, 1, 0, 0);
    layer.sampler.writeChannel(2, 1, 0, 0);

    layer.sampler.writeChannel(0, 2, 0, 0);
    layer.sampler.writeChannel(1, 2, 0, 0);
    layer.sampler.writeChannel(2, 2, 0, 0);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v).toEqual([0, 0]);

});

test('computeCellFilterGradient top', () => {

    const grid = new GridData();
    const layer = GridDataLayer.from('a', DataType.Uint32);

    grid.addLayer(layer);
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(CellMatcherLayerBitMaskTest.from(1, 'a'));
    filter.initialize(grid,0);

    layer.sampler.writeChannel(0, 0, 0, 1);
    layer.sampler.writeChannel(1, 0, 0, 1);
    layer.sampler.writeChannel(2, 0, 0, 1);

    layer.sampler.writeChannel(0, 1, 0, 0);
    layer.sampler.writeChannel(1, 1, 0, 0);
    layer.sampler.writeChannel(2, 1, 0, 0);

    layer.sampler.writeChannel(0, 2, 0, 0);
    layer.sampler.writeChannel(1, 2, 0, 0);
    layer.sampler.writeChannel(2, 2, 0, 0);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v).toEqual([0, -1]);

});
test('computeCellFilterGradient bottom', () => {

    const grid = new GridData();
    const layer = GridDataLayer.from('a', DataType.Uint32);

    grid.addLayer(layer);
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(CellMatcherLayerBitMaskTest.from(1, 'a'));
    filter.initialize(grid,0);

    layer.sampler.writeChannel(0, 0, 0, 0);
    layer.sampler.writeChannel(1, 0, 0, 0);
    layer.sampler.writeChannel(2, 0, 0, 0);

    layer.sampler.writeChannel(0, 1, 0, 0);
    layer.sampler.writeChannel(1, 1, 0, 0);
    layer.sampler.writeChannel(2, 1, 0, 0);

    layer.sampler.writeChannel(0, 2, 0, 1);
    layer.sampler.writeChannel(1, 2, 0, 1);
    layer.sampler.writeChannel(2, 2, 0, 1);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v).toEqual([0, 1]);

});

test('computeCellFilterGradient left', () => {

    const grid = new GridData();
    const layer = GridDataLayer.from('a', DataType.Uint32);

    grid.addLayer(layer);
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(CellMatcherLayerBitMaskTest.from(1, 'a'));
    filter.initialize(grid,0);

    layer.sampler.writeChannel(0, 0, 0, 1);
    layer.sampler.writeChannel(1, 0, 0, 0);
    layer.sampler.writeChannel(2, 0, 0, 0);

    layer.sampler.writeChannel(0, 1, 0, 1);
    layer.sampler.writeChannel(1, 1, 0, 0);
    layer.sampler.writeChannel(2, 1, 0, 0);

    layer.sampler.writeChannel(0, 2, 0, 1);
    layer.sampler.writeChannel(1, 2, 0, 0);
    layer.sampler.writeChannel(2, 2, 0, 0);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v).toEqual([-1, 0]);

});

test('computeCellFilterGradient right', () => {

    const grid = new GridData();
    const layer = GridDataLayer.from('a', DataType.Uint32);

    grid.addLayer(layer);
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(CellMatcherLayerBitMaskTest.from(1, 'a'));
    filter.initialize(grid,0);

    layer.sampler.writeChannel(0, 0, 0, 0);
    layer.sampler.writeChannel(1, 0, 0, 0);
    layer.sampler.writeChannel(2, 0, 0, 1);

    layer.sampler.writeChannel(0, 1, 0, 0);
    layer.sampler.writeChannel(1, 1, 0, 0);
    layer.sampler.writeChannel(2, 1, 0, 1);

    layer.sampler.writeChannel(0, 2, 0, 0);
    layer.sampler.writeChannel(1, 2, 0, 0);
    layer.sampler.writeChannel(2, 2, 0, 1);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v).toEqual([1, 0]);

});

test('computeCellFilterGradient top left', () => {

    const grid = new GridData();
    const layer = GridDataLayer.from('a', DataType.Uint32);
    grid.addLayer(layer);
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(CellMatcherLayerBitMaskTest.from(1, 'a'));
    filter.initialize(grid,0);

    layer.sampler.writeChannel(0, 0, 0, 1);
    layer.sampler.writeChannel(1, 0, 0, 1);
    layer.sampler.writeChannel(2, 0, 0, 1);

    layer.sampler.writeChannel(0, 1, 0, 1);
    layer.sampler.writeChannel(1, 1, 0, 0);
    layer.sampler.writeChannel(2, 1, 0, 0);

    layer.sampler.writeChannel(0, 2, 0, 1);
    layer.sampler.writeChannel(1, 2, 0, 0);
    layer.sampler.writeChannel(2, 2, 0, 0);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v[0]).toBeCloseTo(-0.70710678118);
    expect(v[1]).toBeCloseTo(-0.70710678118);

});

test('computeCellFilterGradient top right', () => {

    const grid = new GridData();
    const layer = GridDataLayer.from('a', DataType.Uint32);

    grid.addLayer(layer);
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(CellMatcherLayerBitMaskTest.from(1, 'a'));
    filter.initialize(grid,0);

    layer.sampler.writeChannel(0, 0, 0, 1);
    layer.sampler.writeChannel(1, 0, 0, 1);
    layer.sampler.writeChannel(2, 0, 0, 1);

    layer.sampler.writeChannel(0, 1, 0, 0);
    layer.sampler.writeChannel(1, 1, 0, 0);
    layer.sampler.writeChannel(2, 1, 0, 1);

    layer.sampler.writeChannel(0, 2, 0, 0);
    layer.sampler.writeChannel(1, 2, 0, 0);
    layer.sampler.writeChannel(2, 2, 0, 1);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v[0]).toBeCloseTo(0.70710678118);
    expect(v[1]).toBeCloseTo(-0.70710678118);

});

test('computeCellFilterGradient bottom left', () => {

    const grid = new GridData();
    const layer = GridDataLayer.from('a', DataType.Uint32);

    grid.addLayer(layer);
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(CellMatcherLayerBitMaskTest.from(1, 'a'));
    filter.initialize(grid,0);

    layer.sampler.writeChannel(0, 0, 0, 1);
    layer.sampler.writeChannel(1, 0, 0, 0);
    layer.sampler.writeChannel(2, 0, 0, 0);

    layer.sampler.writeChannel(0, 1, 0, 1);
    layer.sampler.writeChannel(1, 1, 0, 0);
    layer.sampler.writeChannel(2, 1, 0, 0);

    layer.sampler.writeChannel(0, 2, 0, 1);
    layer.sampler.writeChannel(1, 2, 0, 1);
    layer.sampler.writeChannel(2, 2, 0, 1);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v[0]).toBeCloseTo(-0.70710678118);
    expect(v[1]).toBeCloseTo(0.70710678118);

});

test('computeCellFilterGradient bottom right', () => {

    const grid = new GridData();
    const layer = GridDataLayer.from('a', DataType.Uint32);

    grid.addLayer(layer);
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(CellMatcherLayerBitMaskTest.from(1, 'a'));
    filter.initialize(grid,0);

    layer.sampler.writeChannel(0, 0, 0, 0);
    layer.sampler.writeChannel(1, 0, 0, 0);
    layer.sampler.writeChannel(2, 0, 0, 1);

    layer.sampler.writeChannel(0, 1, 0, 0);
    layer.sampler.writeChannel(1, 1, 0, 0);
    layer.sampler.writeChannel(2, 1, 0, 1);

    layer.sampler.writeChannel(0, 2, 0, 1);
    layer.sampler.writeChannel(1, 2, 0, 1);
    layer.sampler.writeChannel(2, 2, 0, 1);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v[0]).toBeCloseTo(0.70710678118);
    expect(v[1]).toBeCloseTo(0.70710678118);

});
