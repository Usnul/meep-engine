import { TerrainTheme } from "./TerrainTheme.js";
import { MarkerNodeProcessingRuleSet } from "../markers/actions/MarkerNodeProcessingRuleSet.js";

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
    }

    initialize(seed){
        this.terrain.initialize(seed);
    }
}
