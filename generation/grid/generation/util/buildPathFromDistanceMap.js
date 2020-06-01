import { returnZero } from "../../../../core/function/Functions.js";

/**
 *
 * @param {number[]} distances
 * @param {number} width
 * @param {number} height
 * @param {number} x
 * @param {number} y
 * @param {number[]} neighbourhoodMask
 * @param {function(index:number):number} heuristic
 * @returns {number[]} Sequence of indices
 */
export function buildPathFromDistanceMap(
    {
        distances,
        width,
        height,
        x,
        y,
        neighbourhoodMask,
        heuristic = returnZero
    }
) {
    let index = x + y * width;

    const neighbourhoodMaskSize = neighbourhoodMask.length;

    const path = [];

    while (distances[index] >= 0 && index !== -1) {

        path.push(index);

        const c_x = index % width;
        const c_y = (index / width) | 0;

        //pick next index

        let bestNext = -1;
        let bestDistance = distances[index] - 1;
        let bestHeuristicValue = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < neighbourhoodMaskSize; i += 2) {

            const local_nx = neighbourhoodMask[i];
            const local_ny = neighbourhoodMask[i + 1];

            const n_x = local_nx + c_x;

            if (n_x < 0 || n_x >= width) {
                continue;
            }

            const n_y = local_ny + c_y;

            if (n_y < 0 || n_y >= height) {
                continue;
            }

            const neighbour_index = n_x + n_y * width;

            const distance = distances[neighbour_index];
            const heuristicValue = heuristic(neighbour_index);

            if (
                (distance < bestDistance) ||
                (distance === bestDistance && heuristicValue > bestHeuristicValue)
            ) {
                bestNext = neighbour_index;

                bestDistance = distance;

                bestHeuristicValue = heuristicValue;
            }
        }

        index = bestNext;
    }

    return path;
}
