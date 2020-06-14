import ParserError from "../../../core/parser/simple/ParserError.js";
import { readLiteral } from "../../../core/parser/simple/SimpleParser.js";
import { KeyValuePair } from "../../../core/collection/KeyValuePair.js";
import Token from "../../../core/parser/simple/Token.js";
import { TooltipTokenType } from "./TooltipTokenType.js";

/**
 *
 * @param {string} text
 * @param {number} cursor
 * @param {number} length
 */
export function readReferenceValueToken(text, cursor, length) {
    let char, i;

    i = cursor;

    let key;
    //read the key
    while (true) {

        if (i >= length) {
            throw  new ParserError(i, `Input underflow while reading reference key`, text);
        }

        char = text.charAt(i);

        i++;

        if (char === '=') {
            //finish reading the key
            key = text.substring(cursor, i - 1).trim();
            break;
        }

    }

    const valueStart = i;

    if (i >= length) {
        throw  new ParserError(i, `Input underflow while reading reference value, value so far='${text.substring(valueStart, length)}'`, text);
    }

    const literal = readLiteral(text, i, length);

    i = literal.end;


    /**
     *
     * @type {KeyValuePair<string, *>}
     */
    const pair = new KeyValuePair(key, literal.value);

    return new Token(pair, cursor, i, 'reference-value', TooltipTokenType.ReferenceValue);
}
