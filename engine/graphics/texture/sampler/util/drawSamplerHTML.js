import { arrayConstructorByInstance, Sampler2D } from "../Sampler2D.js";
import { scaleSampler2D } from "../scaleSampler2D.js";
import convertSampler2D2Canvas from "../Sampler2D2Canvas.js";

/**
 *
 * @param {HTMLElement} parentNode
 * @param {Sampler2D} sampler
 * @param {number} x
 * @param {number} y
 * @param {number} scale
 * @param {number} offset
 * @param {number} size
 */
export function drawSamplerHTML(parentNode, sampler, x, y, scale, offset, size) {


    const target = new Sampler2D(arrayConstructorByInstance(sampler.data), sampler.itemSize, size, size);

    scaleSampler2D(sampler, target);

    const c = convertSampler2D2Canvas(target, scale, offset);
    c.style.zIndex = 1000;
    c.style.position = "absolute";
    c.style.left = `${x}px`;
    c.style.top = `${y}px`;

    parentNode.appendChild(c);
}
