import { assert } from "../../../../core/assert.js";

/**
 *
 * @param {Vector2} result
 * @param {BinaryHeap} open
 * @param {BitSet} closed
 * @param {number[]} distances
 * @param {GridData} grid
 * @param {number[]} neighbourhoodMask
 * @param {CellMatcher} traversable
 * @param {CellMatcher} objective
 * @returns {boolean}
 */
export function buildDistanceMapToObjective(
    {
        result,
        open,
        closed,
        distances,
        grid,
        neighbourhoodMask,
        traversable,
        objective
    }
) {

    assert.defined(result, 'result');
    assert.defined(open, 'open');
    assert.defined(closed, 'closed');
    assert.defined(distances, 'distances');
    assert.defined(grid, 'grid');
    assert.defined(neighbourhoodMask, 'neighbourhoodMask');
    assert.defined(traversable, 'traversable');
    assert.defined(objective, 'objective');

    assert.isArray(neighbourhoodMask, 'neighbourhoodMask');


    const width = grid.width;

    const neighbourhoodMaskSize = neighbourhoodMask.length;

    while (open.size() > 0) {

        const current = open.pop();

        closed.set(current, true);

        const c_x = current % width;
        const c_y = (current / width) | 0;

        for (let i = 0; i < neighbourhoodMaskSize; i += 2) {

            const local_nx = neighbourhoodMask[i];
            const local_ny = neighbourhoodMask[i + 1];

            const n_x = local_nx + c_x;

            if (n_x < 0 || n_x >= width) {
                continue;
            }

            const n_y = local_ny + c_y;

            if (n_y < 0 || n_y >= grid.height) {
                continue;
            }

            const neighbour_index = n_x + n_y * width;

            if (closed.get(neighbour_index)) {
                continue;
            }

            //check if the cell can be traversed
            if (!traversable.match(grid, n_x, n_y, 0)) {
                //not traversable
                continue;
            }

            const isMatch = objective.match(grid, n_x, n_y, 0);

            const distance = distances[current] + 1;

            const isInOpen = open.contains(neighbour_index);

            if (!isInOpen) {

                open.push(neighbour_index);
                distances[neighbour_index] = distance;

            } else if (distance < distances[neighbour_index]) {

                distances[neighbour_index] = distances;
                open.rescoreElement(neighbour_index);

            }

            if (isMatch) {
                result.set(n_x, n_y);

                return true;
            }
        }
    }

    //connection not found
    return false;

}
