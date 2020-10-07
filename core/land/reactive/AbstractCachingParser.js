import { Cache } from "../../Cache.js";
import { computeStringHash } from "../../primitives/strings/StringUtils.js";
import { assert } from "../../assert.js";

export class AbstractCachingParser {
    constructor() {
        /**
         * Parser cache
         * @type {Cache<string, *>}
         */
        this.__cache = new Cache({
            maxWeight: 1000,
            keyHashFunction: computeStringHash
        });
    }

    /**
     *
     * @param {string} code
     * @returns {T}
     * @private
     */
    __invoke_parser(code) {

    }

    /**
     *
     * @param {string} code
     * @returns {*}
     */
    parse(code) {
        assert.typeOf(code, 'string', 'code');

        const trimmedCode = code.trim();

        assert.notEqual(trimmedCode, "", 'code is empty');
        //check cache
        let parseTree = this.__cache.get(trimmedCode);

        if (parseTree === null) {
            parseTree = this.__invoke_parser(trimmedCode);

            //cache compiled expression
            this.__cache.put(trimmedCode, parseTree);
        }

        return parseTree;
    }

    /**
     *
     * @param {string} code
     * @param errorConsumer
     */
    validate(code, errorConsumer) {
        try {
            this.parse(code);
        } catch (e) {
            errorConsumer(e);

            return false;
        }

        return true;
    }
}
