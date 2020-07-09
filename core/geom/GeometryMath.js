import Vector3 from "./Vector3.js";
import { PI2 } from "../math/MathUtils.js";

const diff = new Vector3();
const edge1 = new Vector3();
const edge2 = new Vector3();
const normal = new Vector3();

/**
 * NOTE: adapted from http://www.geometrictools.com/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h
 * @source https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm (Möller and Trumbore, « Fast, Minimum Storage Ray-Triangle Intersection », Journal of Graphics Tools, vol. 2,‎ 1997, p. 21–28)
 * @param {Vector3} result
 * @param {Vector3} rayOrigin
 * @param {Vector3} rayDirection
 * @param {Vector3} a
 * @param {Vector3} b
 * @param {Vector3} c
 * @returns {boolean}
 */
export function rayTriangleIntersection(result, rayOrigin, rayDirection, a, b, c) {

    edge1.subVectors(b, a);
    edge2.subVectors(c, a);


    normal.crossVectors(edge1, edge2);

    // Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
    // E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
    //   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
    //   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
    //   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
    let DdN = rayDirection.dot(normal);
    let sign;

    if (DdN > 0) {

        // if ( backfaceCulling ) return null;

        sign = 1;

    } else if (DdN < 0) {

        sign = -1;
        DdN = -DdN;

    } else {

        return false;

    }

    diff.subVectors(rayOrigin, a);

    edge2.crossVectors(diff, edge2);

    const DdQxE2 = sign * rayDirection.dot(edge2);

    // b1 < 0, no intersection
    if (DdQxE2 < 0) {

        return false;

    }

    const DdE1xQ = sign * rayDirection.dot(edge1.cross(diff));

    // b2 < 0, no intersection
    if (DdE1xQ < 0) {

        return false;

    }

    // b1+b2 > 1, no intersection
    if (DdQxE2 + DdE1xQ > DdN) {

        return false;

    }

    // Line intersects triangle, check if ray does.
    const QdN = -sign * diff.dot(normal);

    // t < 0, no intersection
    if (QdN < 0) {

        return false;

    }

    // Ray intersects triangle.
    const t = QdN / DdN;

    result.copy(rayDirection);
    result.multiplyScalar(t);
    result.add(rayOrigin);

    return true;
}

/**
 * Pick a random point within a unit circle
 * Based on: https://stackoverflow.com/questions/5837572/generate-a-random-point-within-a-circle-uniformly
 * @param {function} random
 * @param {Vector2} result
 */
export function randomPointInCircle(random, result) {
    const r = Math.sqrt(random());

    const theta = random() * PI2;

    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);

    result.set(x, y);
}

/**
 * Volumetric sampling method, since sample volume is a point, it simply sets result to origin
 * @param {function} random
 * @param {Vector3} result
 */
export function randomPointInPoint(random, result) {
    result.set(0, 0, 0);
}

/**
 *
 * @see based on python code suggested here: https://stackoverflow.com/questions/5408276/sampling-uniformly-distributed-random-points-inside-a-spherical-volume
 * @param {function} random
 * @param {Vector3} result
 */
export function randomPointInSphere(random, result) {
    const phi = PI2 * random();

    const cosTheta = random() * 2 - 1;

    const u = random() * 0.5;

    const theta = Math.acos(cosTheta);

    const r = Math.cbrt(u);

    const sinTheta = Math.sin(theta);

    //compute coordinates
    const x = r * sinTheta * Math.cos(phi);
    const y = r * sinTheta * Math.sin(phi);
    const z = r * cosTheta;

    //write the result
    result.set(x, y, z);
}

/**
 *
 * @see based on python code suggested here: https://stackoverflow.com/questions/5408276/sampling-uniformly-distributed-random-points-inside-a-spherical-volume
 * @param {function} random
 * @param {Vector3} result
 */
export function randomPointOnSphere(random, result) {
    const phi = Math.PI * 2 * random();

    const cosTheta = random() * 2 - 1;

    const theta = Math.acos(cosTheta);

    const sinTheta = Math.sin(theta);

    const r = 0.5;

    //compute coordinates
    const x = r * sinTheta * Math.cos(phi);
    const y = r * sinTheta * Math.sin(phi);
    const z = r * cosTheta;

    //write the result
    result.set(x, y, z);
}

/**
 *
 * @param {function} random
 * @param {Vector3} result
 */
export function randomPointInBox(random, result) {
    const x = random() - 0.5;
    const y = random() - 0.5;
    const z = random() - 0.5;

    result.set(x, y, z);
}

/**
 *
 * @param {function} random
 * @param {Vector3} result
 */
export function randomPointOnBox(random, result) {
    //pick a side
    const side = random();

    //determine axis of the side
    const axis = side % 0.5;

    //convert side and axis to a fixed value for the axis
    const fixedAxis = side > 0.5 ? -0.5 : 0.5;

    let x, y, z;

    if (axis < 0.16666666666) {
        x = fixedAxis;
        y = random() - 0.5;
        z = random() - 0.5;
    } else if (axis < 0.33333333333) {
        x = random() - 0.5;
        y = fixedAxis;
        z = random() - 0.5;
    } else {
        x = random() - 0.5;
        y = random() - 0.5;
        z = fixedAxis;
    }

    result.set(x, y, z);
}
