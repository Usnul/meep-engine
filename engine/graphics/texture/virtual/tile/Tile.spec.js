import { Tile } from "./Tile.js";
import { TileStatus } from "./TileStatus.js";

test("Tile constructor doesn't throw", () => {
    new Tile();
});

test("new tile has Initial status", () => {
    const tile = new Tile();
    expect(tile.status).toBe(TileStatus.Initial);
});
