import ParserError from "../../../core/parser/simple/ParserError.js";
import { skipWhitespace } from "../../../core/parser/simple/SimpleParser.js";
import { readReferenceValueToken } from "./readReferenceValueToken.js";
import { TooltipReferenceValue } from "./TooltipReferenceValue.js";
import Token from "../../../core/parser/simple/Token.js";
import { TooltipTokenType } from "./TooltipTokenType.js";

/**
 *
 * @param {string} text
 * @param {number} cursor
 * @param {number} length
 * @returns {Token}
 */
export function readReferenceToken(text, cursor, length) {
    let i = cursor;
    let char;

    const firstChar = text.charAt(cursor);

    if (firstChar !== '[') {
        throw new ParserError(cursor, `expected reference start: '[', got '${firstChar}' instead`, text);
    }

    i++;

    const tagStartIndex = i;

    let tag;

    // read tag
    while (true) {

        if (i >= length) {
            throw new ParserError(cursor, `input underflow, expected reference separator ':' is missing`, text);
        }

        const char = text.charAt(i);

        if (char === ':') {
            tag = text.substring(tagStartIndex, i);

            i++;

            break;
        }

        i++;
    }

    i = skipWhitespace(text, i, length);

    char = text.charAt(i);

    let values = {};
    //read values
    if (char !== ']') {
        do {

            i = skipWhitespace(text, i, length);

            const valueToken = readReferenceValueToken(text, i, length);

            i = valueToken.end;

            i = skipWhitespace(text, i, length);

            /**
             * @type {KeyValuePair<string,string>}
             */
            const namedValue = valueToken.value;

            values[namedValue.key] = namedValue.value;

            char = text.charAt(i);

            if (char === ',') {
                i++;
            } else {
                break;
            }

        } while (true);

        i = skipWhitespace(text, i, length);

        char = text.charAt(i);
    }

    if (char === ']') {
        //end of sequence

        i++;

        const referenceValue = new TooltipReferenceValue(tag, values);

        return new Token(referenceValue, cursor, i, 'reference', TooltipTokenType.Reference);
    }


    throw new ParserError(i, `input underflow, expected reference end ']' is missing`, text);
}
