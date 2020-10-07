import { AbstractCachingParser } from "../AbstractCachingParser.js";
import { parseReactiveExpression } from "./parser.js";

export class ReactivePegParser extends AbstractCachingParser {

    __invoke_parser(code) {
        return parseReactiveExpression(code);
    }
}

/**
 * @readonly
 * @type {ReactivePegParser}
 */
ReactivePegParser.INSTANCE = new ReactivePegParser();
