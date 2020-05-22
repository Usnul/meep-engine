import { CurrencyDenominationSpec } from "./CurrencyDenominationSpec.js";

export class CurrencyDisplaySpec {
    constructor() {

        /**
         *
         * @type {CurrencyDenominationSpec[]}
         */
        this.denominations = [];

    }

    /**
     *
     * @param {string} id
     * @param {number} value
     */
    add(id, value) {
        const denominationSpec = new CurrencyDenominationSpec();

        denominationSpec.id = id;
        denominationSpec.value = value;

        this.denominations.push(denominationSpec)

        //sort by value in ascending order
        this.denominations.sort(((a, b) => b.value - a.value));
    }
}
