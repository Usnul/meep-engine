import TileGrid from "./TileGrid.js";
import Rectangle from "../../../core/geom/Rectangle.js";
import { computeTileGridMove } from "./computeTileGridMove.js";

test("move to empty space works as intended", () => {
    const tileGrid = new TileGrid(2, 1);

    const a = new Rectangle(0, 0, 1, 1);

    tileGrid.add(a);

    const program = computeTileGridMove(a, 1, 0, tileGrid, tileGrid);
    program.execute();

    expect(a.position.x).toBe(1);
    expect(a.position.y).toBe(0);
});

test("swap of 2 tiles works as intended", () => {
    const tileGrid = new TileGrid(2, 1);

    const a = new Rectangle(0, 0, 1, 1);
    const b = new Rectangle(1, 0, 1, 1);

    tileGrid.add(a);
    tileGrid.add(b);

    const program = computeTileGridMove(a, 1, 0, tileGrid, tileGrid);
    program.execute();

    expect(a.position.x).toBe(1);
    expect(b.position.y).toBe(0);
});

test("swap there and back again works as intended", () => {
    const tileGrid = new TileGrid(2, 1);

    const a = new Rectangle(0, 0, 1, 1);
    const b = new Rectangle(1, 0, 1, 1);

    tileGrid.add(a);
    tileGrid.add(b);

    let program;

    program = computeTileGridMove(a, 1, 0, tileGrid, tileGrid);
    program.execute();

    program = computeTileGridMove(a, 0, 0, tileGrid, tileGrid);
    program.execute();

    expect(a.position.x).toBe(0);
    expect(b.position.y).toBe(0);
});
