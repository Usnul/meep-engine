import { CellMatcher } from "./CellMatcher.js";

export class CellMatcherAny extends CellMatcher {
    match(grid, x, y, rotation) {
        return true;
    }
}

/**
 *
 * @type {CellMatcherAny}
 */
CellMatcherAny.INSTANCE = new CellMatcherAny();
