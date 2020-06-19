import { Cache } from "../../core/Cache.js";
import { computeStringHash, computeUTF8StringByteSize } from "../../core/primitives/strings/StringUtils.js";
import { strictEquals } from "../../core/function/Functions.js";
import { parseTooltipString } from "./parser/parseTooltipString.js";

export class TooltipParser {

    constructor() {

        /**
         *
         * @type {Cache<String,Token[]>}
         * @private
         */
        this.__cache = new Cache({
            maxWeight: 1048576,
            keyWeigher: computeUTF8StringByteSize,
            valueWeigher(tokens) {
                return tokens.length * 256;
            },
            keyHashFunction: computeStringHash,
            keyEqualityFunction: strictEquals
        });

    }

    resetCache() {
        this.__cache.clear();
    }

    /**
     *
     * @param {string} code
     * @returns {Token[]}
     */
    parse(code) {

        const existing = this.__cache.get(code);

        if (existing !== null) {
            // result is cached, reuse
            return existing;
        }

        // no cached result, parse
        const tokens = parseTooltipString(code);

        // cache result
        this.__cache.put(code, tokens);

        return tokens;
    }
}
