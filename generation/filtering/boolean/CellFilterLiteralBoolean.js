import { CellFilter } from "../CellFilter.js";
import DataType from "../../../core/parser/simple/DataType.js";
import { assert } from "../../../core/assert.js";

export class CellFilterLiteralBoolean extends CellFilter {
    constructor() {
        super();

        this.value = true;
    }

    /**
     *
     * @param {boolean} value
     */
    static from(value) {
        assert.typeOf(value, 'boolean', 'value');

        const r = new CellFilterLiteralBoolean();

        r.value = value;

        return r;
    }

    get dataType() {
        return DataType.Boolean;
    }
}
