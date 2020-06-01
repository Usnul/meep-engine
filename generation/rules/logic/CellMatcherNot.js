import { CellMatcherDecorator } from "./CellMatcherDecorator.js";
import { assert } from "../../../core/assert.js";

export class CellMatcherNot extends CellMatcherDecorator {
    match(data, x, y, rotation) {
        return !this.source.match(data, x, y, rotation);
    }

    /**
     *
     * @param {CellMatcher} source
     * @return {CellMatcherNot}
     */
    static from(source) {
        assert.defined(source, 'left');

        assert.equal(source.isCellMatcher, true, 'source.isGridCellRule');

        const r = new CellMatcherNot();

        r.source = source;

        return r;
    }
}
