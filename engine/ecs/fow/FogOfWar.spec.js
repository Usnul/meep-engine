import { FogOfWar } from "./FogOfWar.js";

test('getWorldClearance', () => {
    const sut = new FogOfWar();

    sut.resize(1, 1, 2);


    expect(sut.getWorldClearance(1, 1)).toBe(255);

    sut.reveal(0, 0, 0.5);

    expect(sut.getWorldClearance(1, 1)).toBe(0);
});
