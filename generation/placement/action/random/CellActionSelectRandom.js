import { GridCellAction } from "../GridCellAction.js";
import { randomFromArray, seededRandom } from "../../../../core/math/MathUtils.js";
import { assert } from "../../../../core/assert.js";

export class CellActionSelectRandom extends GridCellAction {
    constructor() {
        super();

        /**
         *
         * @type {function}
         * @private
         */
        this.__random = seededRandom(0);

        /**
         *
         * @type {GridCellAction[]}
         */
        this.options = [];
    }


    /**
     *
     * @param {GridCellAction[]} options
     * @returns {CellActionSelectRandom}
     */
    static from(options) {
        assert.isArray(options, 'options');
        assert.greaterThan(options.length, 0, 'number of options must be greater than 0');

        const r = new CellActionSelectRandom();

        r.options = options;

        return r;
    }

    initialize(data, seed) {
        super.initialize(data, seed);

        this.__random.setCurrentSeed(seed);

        const options = this.options;

        const n = options.length;


        assert.greaterThan(n, 0, 'number of options must be greater than 0')

        for (let i = 0; i < n; i++) {
            const action = options[i];

            assert.equal(action.isGridCellAction, true, 'action.isGridCellAction !== true');

            action.initialize(data, seed);
        }
    }

    execute(data, x, y, rotation) {

        const option = randomFromArray(this.options, this.__random);

        option.execute(data, x, y, rotation);

    }
}
