import { ReactiveLiteralBoolean } from "../terminal/ReactiveLiteralBoolean.js";
import { ReactiveAnd } from "./ReactiveAnd.js";

test('.copy method must not change the original', () => {

    const b0 = ReactiveLiteralBoolean.from(false);
    const b1 = ReactiveLiteralBoolean.from(true);

    const a = new ReactiveAnd();


    a.connect(b0, b1);

    const b = new ReactiveAnd();

    b.copy(a);

    expect(b0.getValue()).toBe(false);
    expect(b1.getValue()).toBe(true);

});
