import { computeUnsignedDistanceField } from "../../../../engine/graphics/texture/sampler/distanceField.js";
import { Sampler2D } from "../../../../engine/graphics/texture/sampler/Sampler2D.js";

/**
 *
 * @param {number[]} result
 * @param {GridData} grid
 * @param {CellMatcher} matcher
 */
export function buildUnsignedDistanceField(result, grid, matcher) {
    const height = grid.height;
    const width = grid.width;

    const maskData = new Uint8Array(width * height);
    maskData.fill(0);

    for (let y = 0; y < height; y++) {

        const rowIndex = y * width;

        for (let x = 0; x < width; x++) {
            const isMatch = matcher.match(grid, x, y, 0);

            if (isMatch) {
                const index = rowIndex + x;

                maskData[index] = 1;
            }
        }
    }

    const mask = new Sampler2D(maskData, 1, width, height);
    const df = new Sampler2D(result, 1, width, height);

    computeUnsignedDistanceField(mask, df, 0);
    
}
