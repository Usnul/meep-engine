import { objectDeepEquals } from "./ObjectUtils.js";

test('objectDeepEquals', () => {
    expect(objectDeepEquals({}, {})).toBe(true);
    expect(objectDeepEquals({ a: 1 }, { a: 1 })).toBe(true);
    expect(objectDeepEquals({ a: 1 }, { a: 2 })).toBe(false);
    expect(objectDeepEquals({ a: 2 }, { a: 1 })).toBe(false);

    expect(objectDeepEquals({ a: 1, b: "cat" }, { a: 1, b: "cat" })).toBe(true);

    expect(objectDeepEquals({ a: 1, b: "cat" }, { a: 1 })).toBe(false);

    expect(objectDeepEquals({ a: 1 }, { a: 1, b: "cat" })).toBe(false);
});
