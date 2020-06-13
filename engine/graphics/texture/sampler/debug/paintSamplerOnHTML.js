import { arrayConstructorByInstance, Sampler2D } from "../Sampler2D.js";
import { scaleSampler2D } from "../scaleSampler2D.js";
import convertSampler2D2Canvas from "../Sampler2D2Canvas.js";

/**
 *
 * @param {Sampler2D} s
 * @param {number} x
 * @param {number} y
 * @param scale
 * @param offset
 */
export function paintSamplerOnHTML(s, x, y, scale, offset) {

    const d = 180;

    const target = new Sampler2D(arrayConstructorByInstance(s.data), s.itemSize, d, d);

    scaleSampler2D(s, target);

    const c = convertSampler2D2Canvas(target, scale, offset);
    c.style.zIndex = 1000;
    c.style.position = "absolute";
    c.style.left = `${x * d}px`;
    c.style.top = `${y * d}px`;

    document.body.appendChild(c);
}
