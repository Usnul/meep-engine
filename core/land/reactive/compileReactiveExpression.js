import { assert } from "../../assert.js";
import { ReactivePegParser } from "./pegjs/ReactivePegParser.js";
import { ReactivePegCompiler } from "./pegjs/ReactivePegCompiler.js";

/**
 *
 * @param {String} code
 * @returns {ReactiveExpression}
 */
export function compileReactiveExpression(code) {
    assert.typeOf(code, 'string', 'code');

    const parseTree = ReactivePegParser.INSTANCE.parse(code);

    const expression = ReactivePegCompiler.compile(parseTree);

    return expression;
}
