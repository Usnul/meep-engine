import { CellularAutomata } from "./CellularAutomata.js";
import { max2, min2 } from "../../core/math/MathUtils.js";

export class CaveGeneratorCellularAutomata extends CellularAutomata {
    step(data, width, height) {


        const maxY = height - 1;
        const maxX = width - 1;

        for (let y = 0; y < height; y++) {
            const rowIndex = y * width;

            const rowIndexTop = max2(y - 1, 0) * width;
            const rowIndexBottom = min2(y + 1, maxY) * width;

            for (let x = 0; x < width; x++) {
                const cellIndex = rowIndex + x;

                const columnLeft = max2(x - 1, 0);
                const columnRight = min2(x + 1, maxX);

                //
                const top = data[rowIndexTop + x];
                const bottom = data[rowIndexBottom + x];
                const left = data[rowIndex + columnLeft];
                const right = data[rowIndex + columnRight];
                //
                const topLeft = data[rowIndexTop + columnLeft];
                const topRight = data[rowIndexTop + columnRight];
                const bottomLeft = data[rowIndexBottom + columnLeft];
                const bottomRight = data[rowIndexBottom + columnRight];

                //count neighbours
                const neighbourSum = top + bottom + left + right + topLeft + topRight + bottomLeft + bottomRight;
                const cellValue = data[cellIndex];

                if (cellValue > 0) {
                    //cell is alive
                    if (neighbourSum < 4) {
                        data[cellIndex] = false;
                    }
                } else {
                    //cell is dead
                    if (neighbourSum > 5) {
                        data[cellIndex] = true;
                    }
                }

            }

        }

    }
}
