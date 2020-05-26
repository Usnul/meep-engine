/**
 * Created by Alex on 15/11/2014.
 */
import { Sampler2D } from '../../graphics/texture/sampler/Sampler2D.js';
import { max2, min2 } from "../../../core/math/MathUtils.js";

/**
 * Uses sobel filter to compute normals for a given height map
 * @param {Sampler2D} heightSampler
 * @return {Sampler2D}
 */
export function convertHeightMap2NormalMap(heightSampler) {

    //
    const height = heightSampler.height;
    const width = heightSampler.width;

    const heightData = heightSampler.data;

    const data = new Float32Array(width * height * 3);


    const maxY = height - 1;
    const maxX = width - 1;
    for (let y = 0; y < height; y++) {
        const rowIndex = y * width;
        const rowIndexTop = max2(y - 1, 0) * width;
        const rowIndexBottom = min2(y + 1, maxY) * width;

        for (let x = 0; x < width; x++) {
            const i = rowIndex + x;

            const j = i * 3;

            const columnLeft = max2(x - 1, 0);
            const columnRight = min2(x + 1, maxX);

            // read surrounding points
            const topLeft = heightData[rowIndexTop + columnLeft];
            const top = heightData[rowIndexTop + x];
            const topRight = heightData[rowIndexTop + columnRight];

            const left = heightData[rowIndex + columnLeft];
            const right = heightData[rowIndex + columnRight];

            const bottomLeft = heightData[rowIndexBottom + columnLeft];
            const bottom = heightData[rowIndexBottom + x];
            const bottomRight = heightData[rowIndexBottom + columnRight];
            //
            const dX = (topRight + 2.0 * right + bottomRight) - (topLeft + 2.0 * left + bottomLeft);
            const dY = (bottomLeft + 2.0 * bottom + bottomRight) - (topLeft + 2.0 * top + topRight);

            //normalize vector
            const magnitude = Math.sqrt(dX * dX + dY * dY + 0.25);

            const _x = dX / magnitude;
            const _y = dY / magnitude;
            const _z = 0.5 / magnitude;

            data[j] = _x;
            data[j + 1] = _y;
            data[j + 2] = _z;
        }
    }

    return new Sampler2D(data, 3, width, height);
}
