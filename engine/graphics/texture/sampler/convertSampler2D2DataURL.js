import convertSampler2D2Canvas from "./Sampler2D2Canvas.js";

/**
 *
 * @param {Sampler2D} sampler
 * @returns {string}
 */
export function convertSampler2D2DataURL(sampler) {

    const canvasElement = document.createElement('canvas');

    var ctx = canvasElement.getContext("2d");

    convertSampler2D2Canvas(sampler, 1, 0, canvasElement);

    return ctx.canvas.toDataURL('image/png');

}
