import { Sampler2D } from "../../../graphics/texture/sampler/Sampler2D.js";
import { clamp } from "../../../../core/math/MathUtils.js";
import { ParameterLookupTable } from "../../../graphics/particles/particular/engine/parameter/ParameterLookupTable.js";
import { passThrough } from "../../../../core/function/Functions.js";


const heatmap_lut = new ParameterLookupTable(4);
heatmap_lut.write([
    0, 0, 0, 255,
    0, 0, 255, 255,
    0, 179, 179, 255,
    0, 255, 0, 255,
    255, 255, 0, 255,
    255, 5, 5, 255
]);
heatmap_lut.computeUniformPositions();

/**
 *
 * @param {TerrainOverlay} overlay
 * @param {Sampler2D} sampler
 * @param {ParameterLookupTable} [lut]
 * @param {NumericInterval} range Range of values of interest within the sampler that are to be mapped onto LUT
 * @param {function(number):number} [lookupScaleFunction]
 */
export function paintTerrainOverlayViaLookupTable({ overlay, sampler, lut = heatmap_lut, range, lookupScaleFunction = passThrough }) {
    let i, j;

    const colorSample = [];

    const w = overlay.size.x;
    const h = overlay.size.y;

    const buffer = Sampler2D.uint8(4, w, h);

    const j_max = h - 1;

    const i_max = w - 1;

    for (j = 0; j < h; j++) {

        const v = j / j_max;

        for (i = 0; i < w; i++) {
            const u = i / i_max;

            const p = sampler.sampleChannelBilinearUV(u, v, 0);

            const scaledPosition = lookupScaleFunction(p);

            const position = clamp(range.normalizeValue(scaledPosition), 0, 1);

            lut.sample(position, colorSample);

            buffer.set(i, j, colorSample);
        }
    }

    overlay.clear();
    overlay.writeData(buffer.data);
}
