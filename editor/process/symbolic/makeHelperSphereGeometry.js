import { BufferGeometry, Float32BufferAttribute } from "three";
import { max2 } from "../../../core/math/MathUtils.js";


/**
 *
 * @param {number[]} vertices
 * @param {number} radius
 * @param {number} angle0
 * @param {number} angle1
 * @param {number} component0
 * @param {number} component1
 * @param {number} offset
 * @param {number} count
 */
function addArc(vertices, radius, angle0, angle1, component0, component1, offset, count) {

    /**
     *
     * @type {number}
     */
    const angleSpan = angle1 - angle0;

    const offset3 = offset * 3;

    for (var i = 0; i < count; ++i) {

        const address = i * 3 + offset3;

        const f = i / (count - 1);

        const angle = angle0 + angleSpan * f;

        vertices[address + component0] = Math.cos(angle) * radius;
        vertices[address + component1] = Math.sin(angle) * radius;

    }
}

/**
 *
 * @param {number} [radius]
 * @param {number} [resolution]
 * @returns {BufferGeometry}
 */
export function makeHelperSphereGeometry(radius = 1, resolution = 64) {
    const geometry = new BufferGeometry();

    const r_4 = max2(2, Math.floor(resolution / 4));

    const pointCount = r_4 * 4 * 3;

    const vertices = new Float32Array(pointCount * 3);


    let offset = 0;

    addArc(vertices, radius, 0, Math.PI * 2, 0, 1, offset, r_4 * 4);
    offset += r_4 * 4;

    addArc(vertices, radius, 0, Math.PI * 1.5, 0, 2, offset, r_4 * 3);
    offset += r_4 * 3;

    addArc(vertices, radius, -Math.PI * 0.5, Math.PI * 1.5, 1, 2, offset, r_4 * 4);
    offset += r_4 * 4;

    addArc(vertices, radius, Math.PI * 1.5, Math.PI * 2, 0, 2, offset, r_4);

    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));


    return geometry;
}
