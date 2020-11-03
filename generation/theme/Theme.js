import { TerrainTheme } from "./TerrainTheme.js";
import { MarkerNodeProcessingRuleSet } from "../markers/actions/MarkerNodeProcessingRuleSet.js";
import { CellProcessingRuleSet } from "./cell/CellProcessingRuleSet.js";
import { assert } from "../../core/assert.js";

export class Theme {
    constructor() {

        /**
         *
         * @type {TerrainTheme}
         */
        this.terrain = new TerrainTheme();

        /**
         *
         * @type {MarkerNodeProcessingRuleSet}
         */
        this.nodes = new MarkerNodeProcessingRuleSet();

        /**
         *
         * @type {CellProcessingRuleSet}
         */
        this.cells = new CellProcessingRuleSet();
    }

    /**
     *
     * @param {number} seed
     * @param {EntityComponentDataset} ecd
     * @param {GridData} grid
     */
    initialize(seed, ecd, grid) {
        assert.defined(ecd, 'ecd');
        assert.notNull(ecd, 'ecd');
        assert.equal(ecd.isEntityComponentDataset, true, 'ecd.isEntityComponentDataset !== true');

        assert.defined(grid, 'grid');

        this.terrain.initialize(grid, seed);
        this.nodes.initialize(grid, ecd, seed);
        this.cells.initialize(seed, ecd, grid);
    }
}
