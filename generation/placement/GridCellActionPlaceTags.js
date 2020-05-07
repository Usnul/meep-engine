import { GridCellAction } from "./GridCellAction.js";
import { Sampler2D } from "../../engine/graphics/texture/sampler/Sampler2D.js";

export class GridCellActionPlaceTags extends GridCellAction {
    constructor() {
        super();


        /**
         *
         * @type {Sampler2D}
         */
        this.tags = Sampler2D.uint32(1, 1, 1);
    }
    /**
     *
     * @param {number} tags
     */
    fill(tags) {
        this.tags.data.fill(tags);
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     */
    resize(x, y) {
        this.tags.resize(x, y);
    }
    /**
     * Write placement tags into the grid at a given position, the tag pattern will be rotated as specified
     */
    execute(data, x, y, rotation) {
        const sin = Math.sin(rotation);
        const cos = Math.cos(rotation);

        const tags = this.tags;

        const height = tags.height;
        const width = tags.width;

        for (let local_y = 0; local_y < height; local_y++) {
            for (let local_x = 0; local_x < width; local_x++) {

                //read the tag value
                const cell_tags = tags.readChannel(local_x, local_y, 0);

                //rotate rule position
                const rotated_local_x = local_x * cos - local_y * sin
                const rotated_local_y = local_x * sin - local_y * cos;

                //
                const target_x = Math.round(rotated_local_x + x);
                const target_y = Math.round(rotated_local_y + y);

                grid.setTags(target_x, target_y, cell_tags);
            }
        }
    }
}
