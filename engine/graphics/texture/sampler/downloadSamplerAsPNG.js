import { downloadUrlAsFile } from "../../../../core/binary/ByteArrayTools.js";
import { convertSampler2D2DataURL } from "./convertSampler2D2DataURL.js";

/**
 *
 * @param {Sampler2D} sampler
 * @param {string} [name]
 */
export function downloadSampler2DAsPNG(sampler, name = 'image') {

    const dataURL = convertSampler2D2DataURL(sampler);

    downloadUrlAsFile(dataURL, `${name}.png`);

}
