import { uv_mapCircleToSquare, uv_mapSquareToCircle } from "./UvUtils.js";
import Vector2 from "../Vector2.js";

test("uv_mapCircleToSquare", () => {
    const v = new Vector2();

    function check(inputX, inputY, outputX, outputY) {

        uv_mapCircleToSquare(v, inputX, inputY);

        expect(v.x).toBeCloseTo(outputX);
        expect(v.y).toBeCloseTo(outputY);
    }

    check(0, 0, 0, 0);

    check(-1, 0, -1, 0);
    check(1, 0, 1, 0);
    check(0, -1, 0, -1);
    check(0, 1, 0, 1);

    const s = Math.SQRT1_2;

    check(s, s, 1, 1);
    check(-s, s, -1, 1);
    check(-s, -s, -1, -1);
    check(s, -s, 1, -1);
});

test("uv_mapSquareToCircle", () => {

    const v = new Vector2();

    function check(inputX, inputY, outputX, outputY) {

        uv_mapSquareToCircle(v, inputX, inputY);

        expect(v.x).toBeCloseTo(outputX);
        expect(v.y).toBeCloseTo(outputY);
    }

    check(0, 0, 0, 0);

    check(-1, 0, -1, 0);
    check(1, 0, 1, 0);
    check(0, -1, 0, -1);
    check(0, 1, 0, 1);

    const s = Math.SQRT1_2;

    check(1, 1, s, s);
    check(-1, 1, -s, s);
    check(-1, -1, -s, -s);
    check(1, -1, s, -s);
});
