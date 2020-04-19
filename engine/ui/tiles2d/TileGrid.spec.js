import TileGrid from "./TileGrid.js";
import Vector2 from "../../../core/geom/Vector2.js";

test("constructor doesn't throw", () => {
    new TileGrid(1, 1);
});

test("findEmptySlotFor in empty grid 1x1", () => {
    const grid = new TileGrid(1, 1);

    const v = new Vector2();

    const found = grid.findEmptySlotFor(v, 1, 1);


    expect(found).toBe(true);

    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
});
