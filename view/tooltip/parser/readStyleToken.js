import ParserError from "../../../core/parser/simple/ParserError.js";
import { TooltipTokenType } from "./TooltipTokenType.js";
import Token from "../../../core/parser/simple/Token.js";

/**
 *
 * @param {string} text
 * @param {number} cursor
 * @param {number} length
 * @returns {Token}
 */
export function readStyleToken(text, cursor, length) {
    let i = cursor;

    const firstChar = text.charAt(cursor);

    if (firstChar !== '[') {
        throw new ParserError(cursor, `expected style start: '[', got '${firstChar}' instead`, text);
    }

    i++;

    const secondChar = text.charAt(i);

    let tokenType;
    if (secondChar === '$') {
        //style start token
        tokenType = TooltipTokenType.StyleStart;
        i++;
    } else if (secondChar === '/') {
        i++;

        const thirdChar = text.charAt(i);

        i++;
        if (thirdChar !== '$') {
            throw new ParserError(i, `expected style end sequence '[/$', instead got '[/${thirdChar}'`, text);
        }

        tokenType = TooltipTokenType.StyleEnd;
    }

    const tagStartIndex = i;

    while (i < length) {
        const char = text.charAt(i);

        if (char === ']') {
            //end of token

            //build tag
            const tag = text.substring(tagStartIndex, i);

            i++;

            return new Token(tag, cursor, i, 'style', tokenType);
        }

        i++;
    }

    throw new ParserError(cursor, `input underflow, missing terminal of style sequence ']'`, text);
}
