import { CellFilterUnaryOperation } from "../../core/CellFilterUnaryOperation.js";
import { assert } from "../../../../core/assert.js";


const sample = [];

export class CellFilterLookupTable extends CellFilterUnaryOperation {
    constructor() {
        super();

        /**
         *
         * @type {ParameterLookupTable}
         */
        this.lut = null;
    }

    /**
     *
     * @param {ParameterLookupTable} lut
     * @param {CellFilter} source
     * @return {CellFilterLookupTable}
     */
    static from(lut, source) {

        assert.equal(lut.isParameterLookupTable, true, 'lut.isParameterLookupTable !== true');
        assert.equal(lut.itemSize, 1, 'lut.itemSize !== 1');

        assert.equal(source.isCellFilter, true, 'source.isCellFilter !== true');

        const r = new CellFilterLookupTable();

        r.lut = lut;
        r.source = source;

        return r;
    }

    operation(v) {
        this.lut.sample(v, sample);

        return sample[0];
    }

}
