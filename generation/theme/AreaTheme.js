import { TerrainTheme } from "./TerrainTheme.js";
import { AreaMask } from "./AreaMask.js";

export class AreaTheme {
    constructor() {
        this.mask = new AreaMask();

        /**
         *
         * @type {TerrainTheme}
         */
        this.terrain = new TerrainTheme();
    }
}
