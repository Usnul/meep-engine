import { ReactiveReference } from "../../../model/reactive/model/terminal/ReactiveReference.js";
import { ReactiveLiteralNumber } from "../../../model/reactive/model/terminal/ReactiveLiteralNumber.js";
import { ReactiveLiteralBoolean } from "../../../model/reactive/model/terminal/ReactiveLiteralBoolean.js";
import { ReactiveLiteralString } from "../../../model/reactive/model/terminal/ReactiveLiteralString.js";
import { ReactiveAnd } from "../../../model/reactive/model/logic/ReactiveAnd.js";
import { ReactiveNot } from "../../../model/reactive/model/logic/ReactiveNot.js";
import { ReactiveOr } from "../../../model/reactive/model/logic/ReactiveOr.js";
import { ReactiveAdd } from "../../../model/reactive/model/arithmetic/ReactiveAdd.js";
import { ReactiveSubtract } from "../../../model/reactive/model/arithmetic/ReactiveSubtract.js";
import { ReactiveMultiply } from "../../../model/reactive/model/arithmetic/ReactiveMultiply.js";
import { ReactiveDivide } from "../../../model/reactive/model/arithmetic/ReactiveDivide.js";
import { ReactiveNegate } from "../../../model/reactive/model/arithmetic/ReactiveNegate.js";
import { ReactiveEquals } from "../../../model/reactive/model/comparative/ReactiveEquals.js";
import { ReactiveNotEquals } from "../../../model/reactive/model/comparative/ReactiveNotEquals.js";
import { ReactiveGreaterThan } from "../../../model/reactive/model/comparative/ReactiveGreaterThan.js";
import { ReactiveGreaterThanOrEqual } from "../../../model/reactive/model/comparative/ReactiveGreaterThanOrEqual.js";
import { ReactiveLessThan } from "../../../model/reactive/model/comparative/ReactiveLessThan.js";
import { ReactiveLessThanOrEqual } from "../../../model/reactive/model/comparative/ReactiveLessThanOrEqual.js";

const Compiler_Types = {
    BinaryExpression(node) {

        const l = compile(node.left);
        const r = compile(node.right);

        const operator = node.operator;

        if (operator === "&&") {
            return ReactiveAnd.from(l, r);
        } else if (operator === "||") {
            return ReactiveOr.from(l, r);
        } else if (operator === "+") {
            return ReactiveAdd.from(l, r);
        } else if (operator === "-") {
            return ReactiveSubtract.from(l, r);
        } else if (operator === "*") {
            return ReactiveMultiply.from(l, r);
        } else if (operator === "/") {
            return ReactiveDivide.from(l, r);
        } else if (operator === "==") {
            return ReactiveEquals.from(l, r);
        } else if (operator === "!=") {
            return ReactiveNotEquals.from(l, r);
        } else if (operator === ">") {
            return ReactiveGreaterThan.from(l, r);
        } else if (operator === ">=") {
            return ReactiveGreaterThanOrEqual.from(l, r);
        } else if (operator === "<") {
            return ReactiveLessThan.from(l, r);
        } else if (operator === "<=") {
            return ReactiveLessThanOrEqual.from(l, r);
        } else {
            throw new Error(`Unsupported binary expression operator '${operator}'`);
        }
    },
    UnaryExpression(node) {

        const source = compile(node.argument);

        const operator = node.operator;

        if (operator === '!') {
            return ReactiveNot.from(source);
        } else if (operator === '-') {
            return ReactiveNegate.from(source);
        } else {
            throw new Error(`Unsupported unary expression operator '${operator}'`);
        }
    },
    Reference(node) {
        const names = [];

        const path = node.path;

        const n = path.length;

        for (let i = 0; i < n; i++) {
            const identifier = path[i];

            names.push(identifier.name);
        }

        return new ReactiveReference(names.join('.'));
    },
    /**
     *
     * @param {{value:(number|string|boolean)}} node
     * @returns {ReactiveLiteralString|ReactiveLiteralNumber|ReactiveLiteralBoolean}
     * @constructor
     */
    Literal(node) {
        const value = node.value;

        const t = typeof value;
        if (t === "number") {
            return ReactiveLiteralNumber.from(value);
        } else if (t === "boolean") {
            return ReactiveLiteralBoolean.from(value);
        } else if (t === "string") {
            return ReactiveLiteralString.from(value);
        } else {
            throw  new Error(`Unsupported literal type '${t}'`);
        }

    }
};

/**
 *
 * @param {{type:string}} node
 */
function compile(node) {
    const c = Compiler_Types[node.type];

    return c(node);
}

export class ReactivePegCompiler {
    constructor() {

    }

    /**
     *
     * @param {Object} syntaxTree
     * @returns {ReactiveExpression}
     */
    static compile(syntaxTree) {
        return compile(syntaxTree);
    }
}
