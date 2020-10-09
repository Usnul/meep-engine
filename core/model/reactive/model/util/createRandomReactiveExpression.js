/**
 *
 * @param {ReactiveExpression} a
 * @param {ReactiveExpression} b
 * @returns {ReactiveExpression}
 */
import { randomFromArray } from "../../../../math/MathUtils.js";
import DataType from "../../../../parser/simple/DataType.js";
import { ReactiveGreaterThan } from "../comparative/ReactiveGreaterThan.js";
import { ReactiveGreaterThanOrEqual } from "../comparative/ReactiveGreaterThanOrEqual.js";
import { ReactiveLessThan } from "../comparative/ReactiveLessThan.js";
import { ReactiveLessThanOrEqual } from "../comparative/ReactiveLessThanOrEqual.js";
import { ReactiveEquals } from "../comparative/ReactiveEquals.js";
import { ReactiveNotEquals } from "../comparative/ReactiveNotEquals.js";
import { ReactiveAdd } from "../arithmetic/ReactiveAdd.js";
import { ReactiveSubtract } from "../arithmetic/ReactiveSubtract.js";
import { ReactiveMultiply } from "../arithmetic/ReactiveMultiply.js";
import { ReactiveDivide } from "../arithmetic/ReactiveDivide.js";
import { ReactiveAnd } from "../logic/ReactiveAnd.js";
import { ReactiveOr } from "../logic/ReactiveOr.js";
import { ReactiveLiteralNumber } from "../terminal/ReactiveLiteralNumber.js";
import { ReactiveLiteralString } from "../terminal/ReactiveLiteralString.js";

/**
 *
 * @param {ReactiveExpression} exp
 * @returns {ReactiveExpression}
 */
function convert_to_boolean(exp) {
    const dataType = exp.dataType;

    if (dataType === DataType.Boolean) {
        return exp;
    } else if (dataType === DataType.Number) {
        return ReactiveGreaterThan.from(exp, ReactiveLiteralNumber.from(0));
    } else if (dataType === DataType.String) {
        return ReactiveNotEquals.from(exp, ReactiveLiteralString.from(""))
    } else {
        throw new Error(`Unsupported data type '${dataType}'`);
    }

}

/**
 *
 * @param {function} random
 * @param {ReactiveExpression} a
 * @param {ReactiveExpression} b
 */
function join(random, a, b) {
    const dataType = a.dataType;

    if (dataType !== b.dataType) {
        // inconsistent data types
        return join(random, convert_to_boolean(a), convert_to_boolean(b));
    }

    let NodeSet;

    if (dataType === DataType.Number) {
        NodeSet = [
            ReactiveGreaterThan,
            ReactiveGreaterThanOrEqual,
            ReactiveLessThan,
            ReactiveLessThanOrEqual,
            ReactiveEquals,
            ReactiveNotEquals,
            ReactiveAdd,
            ReactiveSubtract,
            ReactiveMultiply,
            ReactiveDivide
        ];
    } else if (dataType === DataType.String) {
        NodeSet = [
            ReactiveEquals,
            ReactiveNotEquals
        ];
    } else if (dataType === DataType.Boolean) {
        NodeSet = [
            ReactiveEquals,
            ReactiveNotEquals,
            ReactiveAnd,
            ReactiveOr
        ];
    } else {
        NodeSet = [ReactiveEquals];
    }

    const NodeClass = randomFromArray(random, NodeSet);

    return NodeClass.from(a, b);
}

/**
 *
 * @param {ReactiveExpression} exp
 * @param {Object<ReactiveExpression[]>} map
 */
function add_to_type_map(exp, map) {

    const dataType = exp.dataType;

    let set = map[dataType];

    if (set === undefined) {
        set = [];

        map[dataType] = set;
    }

    set.push(exp);

}

function build_level(random, nodes) {
    const type_map = {};

    const n = nodes.length;

    for (let i = 0; i < n; i++) {
        add_to_type_map(nodes[i], type_map);
    }

    for (let i = 0; i < tuples; i++) {
        const a = randomFromArray(random, terminals);

        const dataType = a.dataType;

        const b = randomFromArray(undefined, type_map[dataType]);


    }
}

/**
 *
 * @param {function} random
 * @param {ReactiveExpression[]} terminals
 * @param {number} tuples
 * @returns {ReactiveExpression}
 */
export function createRandomReactiveExpression(random, terminals, tuples) {
    const type_map = {};

    const n = terminals.length;

    for (let i = 0; i < n; i++) {
        add_to_type_map(terminals[i], type_map);
    }

    const open = [];

    for (let i = 0; i < tuples; i++) {
        const a = randomFromArray(random, terminals);

        const dataType = a.dataType;

        const b = randomFromArray(random, type_map[dataType]);

        const t = join(random, a, b);

        open.push(t);
    }

    while (open.length > 1) {
        const a = open.pop();
        const b = open.pop();

        open.unshift(join(random, a, b));
    }

    return open[0];
}
