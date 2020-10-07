import nearley from "nearley";
import grammar from "../nearley/ReactiveNearley.js";
import { AbstractCachingParser } from "../AbstractCachingParser.js";

const rules = nearley.Grammar.fromCompiled(grammar);

export class ReactiveParser extends AbstractCachingParser {

    /**
     *
     * @param {string} code
     * @returns {*}
     */
    __invoke_parser(code) {
        const parser = new nearley.Parser(rules);

        parser.feed(code);

        const results = parser.results;

        if (results.length > 1) {
            console.warn(`Multiple parses of '${code}'`, results);
        }

        return results[0];

    }
}

/**
 * @readonly
 * @type {ReactiveParser}
 */
ReactiveParser.INSTANCE = new ReactiveParser();
