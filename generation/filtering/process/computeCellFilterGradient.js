/**
 *
 * @param {number[]} result
 * @param {number} x
 * @param {number} y
 * @param {CellFilter} filter
 * @param {GridData} grid
 */
export function computeCellFilterGradient(result, x, y, filter, grid) {

    //read surrounding points
    const topLeft = filter.execute(grid, x - 1, y - 1, 0);
    const top = filter.execute(grid, x, y - 1, 0);
    const topRight = filter.execute(grid, x + 1, y - 1, 0);

    const left = filter.execute(grid, x - 1, y, 0);
    const right = filter.execute(grid, x + 1, y, 0);

    const bottomLeft = filter.execute(grid, x - 1, y + 1, 0);
    const bottom = filter.execute(grid, x, y + 1, 0);
    const bottomRight = filter.execute(grid, x + 1, y + 1, 0);

    // compute gradients
    const dX = (topRight + 2.0 * right + bottomRight) - (topLeft + 2.0 * left + bottomLeft);
    const dY = (bottomLeft + 2.0 * bottom + bottomRight) - (topLeft + 2.0 * top + topRight);

    //normalize vector
    const magnitude = Math.sqrt(dX * dX + dY * dY + 0.25);

    const _x = dX / magnitude;
    const _y = dY / magnitude;

    result[0] = _x;
    result[1] = _y;
}
