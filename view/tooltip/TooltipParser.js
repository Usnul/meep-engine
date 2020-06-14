import Token from "../../core/parser/simple/Token.js";
import { assert } from "../../core/assert.js";
import { TooltipTokenType } from "./parser/TooltipTokenType.js";
import { readReferenceToken } from "./parser/readReferenceToken.js";
import { readStyleToken } from "./parser/readStyleToken.js";


/**
 *
 * @param {string} text
 * @param {number} cursor
 * @param {number} length
 * @returns {Token}
 */
function readTextToken(text, cursor, length) {
    let i = cursor;

    while (i < length) {
        const char = text.charAt(i);

        if (char === '[') {
            //consider to be end of sequence
            break;
        }

        i++;
    }

    const value = text.substring(cursor, i);

    return new Token(value, cursor, i, 'text', TooltipTokenType.Text);
}

/**
 * @param {string} text
 * @returns {Token[]}
 */
export function parseTooltipString(text) {
    let cursor = 0;
    let length = text.length;

    const result = [];

    while (cursor < length) {

        /**
         * @type {Token}
         */
        let token;

        const firstChar = text.charAt(cursor);

        if (firstChar === '[') {
            const secondChar = text.charAt(cursor + 1);

            if (secondChar === '$' || secondChar === '/') {
                token = readStyleToken(text, cursor, length);
            } else {
                token = readReferenceToken(text, cursor, length);
            }

        } else {
            token = readTextToken(text, cursor, length);
        }

        if (token === undefined) {
            //no token read. this shouldn't happen
            break;
        }

        result.push(token);

        assert.ok(cursor < token.end, `token ends (=${cursor}) before the cursor(=${cursor})`);

        cursor = token.end;
    }

    return result;
}
