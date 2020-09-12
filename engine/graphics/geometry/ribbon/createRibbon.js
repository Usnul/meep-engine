import { Ribbon } from "./Ribbon.js";
import { BufferAttribute, DynamicDrawUsage, StaticDrawUsage } from "three";

/**
 *
 * @param {number} numSegments
 * @returns {Ribbon}
 */
export function createRibbon(numSegments) {

    const ribbon = new Ribbon(numSegments, 1);

    /**
     *
     * @type {BufferGeometry}
     */
    const geometry = ribbon.geometry;

    /*
     attribute vec3 last, current, next;
     attribute vec3 barycentric;
     attribute float off;
     attribute float uvOffset;
     */

    const position = geometry.attributes.position;
    const vertexCount = position.count;


    const last = new Float32Array(vertexCount * 3);
    const next = new Float32Array(vertexCount * 3);
    const off = new Int8Array(vertexCount);
    const uvOffset = new Float32Array(vertexCount);
    const age = new Float32Array(vertexCount);

    const aLast = new BufferAttribute(last, 3);
    const aNext = new BufferAttribute(next, 3);
    const aOff = new BufferAttribute(off, 1);
    const aUvOffset = new BufferAttribute(uvOffset, 1);
    const aAge = new BufferAttribute(age, 1);


    geometry.setAttribute("last", aLast);
    geometry.setAttribute("next", aNext);
    geometry.setAttribute("off", aOff); // offset attribute
    geometry.setAttribute("uvOffset", aUvOffset);
    geometry.setAttribute("age", aAge);


    aLast.needsUpdate = true;
    aNext.needsUpdate = true;
    aOff.needsUpdate = true;
    aUvOffset.needsUpdate = true;
    aAge.needsUpdate = true;
    aAge.usage = DynamicDrawUsage;

    //set offsets
    aOff.usage = StaticDrawUsage;

    ribbon.traverseEdges(function (a, b, index, maxIndex) {
        off[a] = 1;
        off[b] = -1;
    });

    return ribbon;
}
