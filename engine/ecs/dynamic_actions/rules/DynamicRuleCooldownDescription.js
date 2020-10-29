import { NumericInterval } from "../../../../core/math/interval/NumericInterval.js";

export class DynamicRuleCooldownDescription {
    constructor() {

        /**
         *
         * @type {string}
         */
        this.id = "";

        /**
         *
         * @type {NumericInterval}
         */
        this.value = new NumericInterval(0, 0);
    }

    fromJSON({ id, value }) {

        this.id = id;

        this.value.fromJSON(value);

    }

    static fromJSON(j) {
        const r = new DynamicRuleCooldownDescription();

        r.fromJSON(j);

        return r;
    }
}
