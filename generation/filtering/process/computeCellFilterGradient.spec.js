import { GridData } from "../../GridData.js";
import { computeCellFilterGradient } from "./computeCellFilterGradient.js";
import { CellFilterCellMatcher } from "../CellFilterCellMatcher.js";
import { GridCellRuleContainsTag } from "../../rules/GridCellRuleContainsTag.js";

test('computeCellFilterGradient center', () => {

    const grid = new GridData();
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(GridCellRuleContainsTag.from(1));

    grid.writeTags(0, 0, 0);
    grid.writeTags(1, 0, 0);
    grid.writeTags(2, 0, 0);

    grid.writeTags(0, 1, 0);
    grid.writeTags(1, 1, 0);
    grid.writeTags(2, 1, 0);

    grid.writeTags(0, 2, 0);
    grid.writeTags(1, 2, 0);
    grid.writeTags(2, 2, 0);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v).toEqual([0, 0]);

});

test('computeCellFilterGradient top', () => {

    const grid = new GridData();
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(GridCellRuleContainsTag.from(1));

    grid.writeTags(0, 0, 1);
    grid.writeTags(1, 0, 1);
    grid.writeTags(2, 0, 1);

    grid.writeTags(0, 1, 0);
    grid.writeTags(1, 1, 0);
    grid.writeTags(2, 1, 0);

    grid.writeTags(0, 2, 0);
    grid.writeTags(1, 2, 0);
    grid.writeTags(2, 2, 0);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v).toEqual([0, -1]);

});
test('computeCellFilterGradient bottom', () => {

    const grid = new GridData();
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(GridCellRuleContainsTag.from(1));

    grid.writeTags(0, 0, 0);
    grid.writeTags(1, 0, 0);
    grid.writeTags(2, 0, 0);

    grid.writeTags(0, 1, 0);
    grid.writeTags(1, 1, 0);
    grid.writeTags(2, 1, 0);

    grid.writeTags(0, 2, 1);
    grid.writeTags(1, 2, 1);
    grid.writeTags(2, 2, 1);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v).toEqual([0, 1]);

});

test('computeCellFilterGradient left', () => {

    const grid = new GridData();
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(GridCellRuleContainsTag.from(1));

    grid.writeTags(0, 0, 1);
    grid.writeTags(1, 0, 0);
    grid.writeTags(2, 0, 0);

    grid.writeTags(0, 1, 1);
    grid.writeTags(1, 1, 0);
    grid.writeTags(2, 1, 0);

    grid.writeTags(0, 2, 1);
    grid.writeTags(1, 2, 0);
    grid.writeTags(2, 2, 0);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v).toEqual([-1, 0]);

});

test('computeCellFilterGradient right', () => {

    const grid = new GridData();
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(GridCellRuleContainsTag.from(1));

    grid.writeTags(0, 0, 0);
    grid.writeTags(1, 0, 0);
    grid.writeTags(2, 0, 1);

    grid.writeTags(0, 1, 0);
    grid.writeTags(1, 1, 0);
    grid.writeTags(2, 1, 1);

    grid.writeTags(0, 2, 0);
    grid.writeTags(1, 2, 0);
    grid.writeTags(2, 2, 1);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v).toEqual([1, 0]);

});

test('computeCellFilterGradient top left', () => {

    const grid = new GridData();
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(GridCellRuleContainsTag.from(1));

    grid.writeTags(0, 0, 1);
    grid.writeTags(1, 0, 1);
    grid.writeTags(2, 0, 1);

    grid.writeTags(0, 1, 1);
    grid.writeTags(1, 1, 0);
    grid.writeTags(2, 1, 0);

    grid.writeTags(0, 2, 1);
    grid.writeTags(1, 2, 0);
    grid.writeTags(2, 2, 0);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v[0]).toBeCloseTo(-0.70710678118);
    expect(v[1]).toBeCloseTo(-0.70710678118);

});

test('computeCellFilterGradient top right', () => {

    const grid = new GridData();
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(GridCellRuleContainsTag.from(1));

    grid.writeTags(0, 0, 1);
    grid.writeTags(1, 0, 1);
    grid.writeTags(2, 0, 1);

    grid.writeTags(0, 1, 0);
    grid.writeTags(1, 1, 0);
    grid.writeTags(2, 1, 1);

    grid.writeTags(0, 2, 0);
    grid.writeTags(1, 2, 0);
    grid.writeTags(2, 2, 1);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v[0]).toBeCloseTo(0.70710678118);
    expect(v[1]).toBeCloseTo(-0.70710678118);

});

test('computeCellFilterGradient bottom left', () => {

    const grid = new GridData();
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(GridCellRuleContainsTag.from(1));

    grid.writeTags(0, 0, 1);
    grid.writeTags(1, 0, 0);
    grid.writeTags(2, 0, 0);

    grid.writeTags(0, 1, 1);
    grid.writeTags(1, 1, 0);
    grid.writeTags(2, 1, 0);

    grid.writeTags(0, 2, 1);
    grid.writeTags(1, 2, 1);
    grid.writeTags(2, 2, 1);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v[0]).toBeCloseTo(-0.70710678118);
    expect(v[1]).toBeCloseTo(0.70710678118);

});

test('computeCellFilterGradient bottom right', () => {

    const grid = new GridData();
    grid.resize(3, 3);

    const v = [];

    const filter = CellFilterCellMatcher.from(GridCellRuleContainsTag.from(1));

    grid.writeTags(0, 0, 0);
    grid.writeTags(1, 0, 0);
    grid.writeTags(2, 0, 1);

    grid.writeTags(0, 1, 0);
    grid.writeTags(1, 1, 0);
    grid.writeTags(2, 1, 1);

    grid.writeTags(0, 2, 1);
    grid.writeTags(1, 2, 1);
    grid.writeTags(2, 2, 1);

    computeCellFilterGradient(v, 1, 1, filter, grid);

    expect(v[0]).toBeCloseTo(0.70710678118);
    expect(v[1]).toBeCloseTo(0.70710678118);

});
