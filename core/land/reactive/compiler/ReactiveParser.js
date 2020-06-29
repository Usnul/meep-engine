import { Cache } from "../../../Cache.js";
import { computeStringHash } from "../../../primitives/strings/StringUtils.js";
import nearley from "nearley";
import { assert } from "../../../assert.js";
import grammar from "../nearley/ReactiveNearley.js";

const rules = nearley.Grammar.fromCompiled(grammar);

export class ReactiveParser {
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
     * @returns {*}
     */
    parse(code) {
        const trimmedCode = code.trim();

        assert.notEqual(trimmedCode, "", 'code is empty');
        //check cache
        let parseTree = this.__cache.get(trimmedCode);

        if (parseTree === null) {
            const parser = new nearley.Parser(rules);

            parser.feed(trimmedCode);

            const results = parser.results;

            if (results.length > 1) {
                console.warn(`Multiple parses of '${trimmedCode}'`, results);
            }

            parseTree = results[0];

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

/**
 * @readonly
 * @type {ReactiveParser}
 */
ReactiveParser.INSTANCE = new ReactiveParser();
