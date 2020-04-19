import { TileAddress } from "./TileAddress.js";

test("TileAddress equals works correctly", () => {
    const a = new TileAddress();
    const b = new TileAddress();

    expect(a.equals(b)).toBeTruthy();

    a.x = 1;
    a.y = 3;
    a.mip = 7;

    expect(a.equals(b)).toBeFalsy();
    expect(b.equals(a)).toBeFalsy();

    b.x = 1;

    expect(a.equals(b)).toBeFalsy();
    expect(b.equals(a)).toBeFalsy();

    b.y = 3;

    expect(a.equals(b)).toBeFalsy();
    expect(b.equals(a)).toBeFalsy();

    b.mip = 7;

    expect(a.equals(b)).toBeTruthy();
    expect(b.equals(a)).toBeTruthy();
});
