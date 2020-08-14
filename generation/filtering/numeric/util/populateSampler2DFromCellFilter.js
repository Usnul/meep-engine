/**
 * Utility function, mainly useful for visualizing filter values
 * @param {Sampler2D} result
 * @param {CellFilter} filter
 * @param {GridData} grid
 */
export function populateSampler2DFromCellFilter({ result, filter, grid }) {

    if (!filter.initialized) {
        filter.initialize(grid, 0);
    }

    for (let y = 0; y < result.height; y++) {

        const v = y / (result.height - 1);

        const grid_y = v * (grid.height - 1);

        for (let x = 0; x < result.width; x++) {

            const u = x / (result.width - 1);

            const grid_x = u * (grid.width - 1);

            const filterValue = filter.execute(grid, grid_x, grid_y, 0);

            result.writeChannel(x, y, 0, filterValue);

        }
    }
}
